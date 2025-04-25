/**
 * Analyze trends over time in insurance claims data
 */
export async function analyzeTrends(request) {
  try {
    const { resultId } = await request.json();
    
    if (!resultId) {
      return new Response(
        JSON.stringify({ error: 'No result ID provided for analysis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the extraction result from KV
    const extractionResult = await HEALTH_INSURANCE_DATA.get(`extraction:${resultId}`, { type: 'json' });
    
    if (!extractionResult) {
      return new Response(
        JSON.stringify({ error: 'No data found for the provided result ID' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Process data and generate trends analysis
    const trendResults = analyzeTrendPatterns(extractionResult);
    
    return new Response(
      JSON.stringify(trendResults),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error analyzing trends:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze trends: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Analyze trends over time in insurance claims data
 * @param {Array} data - The processed data rows
 * @returns {Object} Trend analysis results
 */
export function analyzeTrendPatterns(data) {
  if (!data || !data.length) {
    return { monthlyTrends: [], payerTrends: [], overallTrend: {} };
  }

  // Calculate monthly trends
  const monthlyTrends = d3.rollup(
    data,
    v => ({
      totalClaims: v.length,
      rejectedClaims: v.filter(row => row.claimStatus === 'Rejected').length,
      rejectionRate: (v.filter(row => row.claimStatus === 'Rejected').length / v.length) * 100,
      totalAmount: d3.sum(v, d => d.claimAmount || 0),
      paidAmount: d3.sum(v, d => d.paidAmount || 0)
    }),
    d => d.claimDate.substring(0, 7) // Group by month
  );

  const monthlyTrendsArray = Array.from(monthlyTrends, ([month, stats]) => ({
    month,
    ...stats
  })).sort((a, b) => new Date(a.month) - new Date(b.month));

  // Calculate payer trends
  const payerTrends = d3.rollup(
    data,
    v => ({
      totalClaims: v.length,
      rejectedClaims: v.filter(row => row.claimStatus === 'Rejected').length,
      rejectionRate: (v.filter(row => row.claimStatus === 'Rejected').length / v.length) * 100,
      totalAmount: d3.sum(v, d => d.claimAmount || 0),
      paidAmount: d3.sum(v, d => d.paidAmount || 0),
      averagePaidAmount: d3.mean(v, d => d.paidAmount || 0)
    }),
    d => d.payerName
  );

  const payerTrendsArray = Array.from(payerTrends, ([payer, stats]) => ({
    payer,
    ...stats
  })).sort((a, b) => b.totalClaims - a.totalClaims);

  // Calculate overall trend changes
  const firstMonth = monthlyTrendsArray[0];
  const lastMonth = monthlyTrendsArray[monthlyTrendsArray.length - 1];
  const claimVolumeChange = ((lastMonth.totalClaims - firstMonth.totalClaims) / firstMonth.totalClaims) * 100;
  const rejectionRateChange = lastMonth.rejectionRate - firstMonth.rejectionRate;
  const averageClaimAmountChange = ((lastMonth.totalAmount / lastMonth.totalClaims) - (firstMonth.totalAmount / firstMonth.totalClaims)) / (firstMonth.totalAmount / firstMonth.totalClaims) * 100;

  return {
    monthlyTrends: monthlyTrendsArray,
    payerTrends: payerTrendsArray,
    overallTrend: {
      claimVolumeChange,
      rejectionRateChange,
      averageClaimAmountChange
    }
  };
}
