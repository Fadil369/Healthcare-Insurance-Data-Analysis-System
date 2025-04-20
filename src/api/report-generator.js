/**
 * Generate reports based on analysis results
 */

export async function generateReport(request) {
  try {
    const { analysisResults, reportType = 'json' } = await request.json();
    
    if (!analysisResults) {
      return new Response(
        JSON.stringify({ error: 'No analysis results provided for report generation' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    let reportContent;
    let fileName;
    let contentType;
    
    // Generate report based on the requested type
    if (reportType === 'json') {
      reportContent = JSON.stringify(analysisResults, null, 2);
      fileName = 'insurance-analysis-report.json';
      contentType = 'application/json';
    } 
    else if (reportType === 'csv') {
      reportContent = generateCSVReport(analysisResults);
      fileName = 'insurance-analysis-report.csv';
      contentType = 'text/csv';
    } 
    else {
      return new Response(
        JSON.stringify({ error: `Unsupported report type: ${reportType}. Supported types: json, csv` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Return the generated report for download
    return new Response(reportContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate report: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Generate a CSV report from analysis results
 * @param {Object} results - The analysis results
 * @returns {string} CSV formatted report
 */
function generateCSVReport(results) {
  let csvContent = '';
  
  // Add timestamp
  csvContent += `Healthcare Insurance Data Analysis Report\n`;
  csvContent += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Add overall stats if available
  if (results.overallStats) {
    csvContent += 'OVERALL STATISTICS\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Total Claims,${results.overallStats.totalClaims}\n`;
    csvContent += `Rejected Claims,${results.overallStats.rejectedClaims}\n`;
    csvContent += `Rejection Rate,${results.overallStats.rejectionRate.toFixed(2)}%\n`;
    
    if (results.overallStats.totalAmount) {
      csvContent += `Total Amount,$${results.overallStats.totalAmount.toFixed(2)}\n`;
    }
    
    if (results.overallStats.averageProcessingDays) {
      csvContent += `Average Processing Days,${results.overallStats.averageProcessingDays.toFixed(1)}\n`;
    }
    
    csvContent += '\n';
  }
  
  // Add rejection reasons if available
  if (results.reasonsAnalysis && results.reasonsAnalysis.length > 0) {
    csvContent += 'REJECTION REASONS ANALYSIS\n';
    csvContent += 'Reason,Count,Percentage\n';
    
    results.reasonsAnalysis.forEach(item => {
      // Escape any commas in the reason text
      const escapedReason = `"${item.reason.replace(/"/g, '""')}"`;
      csvContent += `${escapedReason},${item.count},${item.percentage.toFixed(2)}%\n`;
    });
    
    csvContent += '\n';
  }
  
  // Add provider analysis if available
  if (results.providersAnalysis && results.providersAnalysis.length > 0) {
    csvContent += 'PROVIDER REJECTION ANALYSIS\n';
    csvContent += 'Provider,Rejection Count,Percentage\n';
    
    results.providersAnalysis.forEach(item => {
      const escapedProvider = `"${item.provider.replace(/"/g, '""')}"`;
      csvContent += `${escapedProvider},${item.rejectionCount},${item.percentage.toFixed(2)}%\n`;
    });
    
    csvContent += '\n';
  }
  
  // Add monthly trends if available
  if (results.monthlyTrends && results.monthlyTrends.byMonth) {
    csvContent += 'MONTHLY TRENDS\n';
    csvContent += 'Month,Total Claims,Rejected Claims,Rejection Rate,Total Amount,Paid Amount\n';
    
    results.monthlyTrends.byMonth.forEach(item => {
      const row = [
        item.month,
        item.totalClaims,
        item.rejectedClaims,
        `${item.rejectionRate.toFixed(2)}%`,
        `$${item.totalAmount.toFixed(2)}`,
        `$${item.paidAmount.toFixed(2)}`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    csvContent += '\n';
  }
  
  // Add payer trends if available
  if (results.payerTrends && results.payerTrends.length > 0) {
    csvContent += 'PAYER ANALYSIS\n';
    csvContent += 'Payer,Total Claims,Rejected Claims,Rejection Rate,Total Amount,Paid Amount,Average Paid Amount\n';
    
    results.payerTrends.forEach(item => {
      const escapedPayer = `"${item.payer.replace(/"/g, '""')}"`;
      const row = [
        escapedPayer,
        item.totalClaims,
        item.rejectedClaims,
        `${item.rejectionRate.toFixed(2)}%`,
        `$${item.totalAmount.toFixed(2)}`,
        `$${item.paidAmount.toFixed(2)}`,
        `$${item.averagePaidAmount.toFixed(2)}`
      ];
      csvContent += row.join(',') + '\n';
    });
  }
  
  return csvContent;
}
