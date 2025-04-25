/**
 * Analyze rejection patterns in insurance claims data
 */
export async function analyzeRejections(request) {
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
    
    // Process data and generate analysis
    // In a real implementation, this would do sophisticated analysis
    // For now, we're creating a placeholder that would be expanded
    const analysisResults = {
      overallStats: {
        totalClaims: 1250,
        rejectedClaims: 184,
        rejectionRate: 14.72
      },
      reasonsAnalysis: [
        { reason: 'Missing Information', count: 58, percentage: 31.52 },
        { reason: 'Service Not Covered', count: 42, percentage: 22.83 },
        { reason: 'Authorization Required', count: 28, percentage: 15.22 },
        { reason: 'Duplicate Claim', count: 22, percentage: 11.96 },
        { reason: 'Invalid Coding', count: 18, percentage: 9.78 },
        { reason: 'Patient Eligibility', count: 16, percentage: 8.70 }
      ],
      providersAnalysis: [
        { 
          provider: 'Northeast Medical Center', 
          rejectionCount: 45, 
          percentage: 18.75,
          topReasons: [
            { reason: 'Missing Information', count: 15 },
            { reason: 'Authorization Required', count: 12 }
          ]
        },
        { 
          provider: 'Westside Health Partners', 
          rejectionCount: 38, 
          percentage: 15.83,
          topReasons: [
            { reason: 'Service Not Covered', count: 14 },
            { reason: 'Invalid Coding', count: 9 }
          ]
        },
        { 
          provider: 'Southlake Hospital', 
          rejectionCount: 32, 
          percentage: 13.33,
          topReasons: [
            { reason: 'Duplicate Claim', count: 11 },
            { reason: 'Missing Information', count: 8 }
          ]
        }
      ],
      timeAnalysis: {
        byMonth: [
          { month: '2024-01', total: 180, rejected: 28, rejectionRate: 15.56 },
          { month: '2024-02', total: 195, rejected: 29, rejectionRate: 14.87 },
          { month: '2024-03', total: 210, rejected: 30, rejectionRate: 14.29 },
          { month: '2024-04', total: 226, rejected: 31, rejectionRate: 13.72 },
          { month: '2024-05', total: 218, rejected: 33, rejectionRate: 15.14 },
          { month: '2024-06', total: 221, rejected: 33, rejectionRate: 14.93 }
        ]
      }
    };
    
    return new Response(
      JSON.stringify(analysisResults),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error analyzing rejections:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze rejections: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Analyze rejection patterns in insurance claims data
 * @param {Array} data - The processed data rows
 * @returns {Object} Rejection analysis results
 */
export function analyzeRejectionPatterns(data) {
  if (!data || !data.length) {
    return { overallStats: {}, reasonsAnalysis: [], providersAnalysis: [], timeAnalysis: {} };
  }

  // Calculate overall statistics
  const totalClaims = data.length;
  const rejectedClaims = data.filter(row => row.claimStatus === 'Rejected').length;
  const rejectionRate = (rejectedClaims / totalClaims) * 100;

  // Analyze rejection reasons
  const reasonsAnalysis = d3.rollup(
    data.filter(row => row.claimStatus === 'Rejected'),
    v => v.length,
    d => d.rejectionReason
  );

  const reasonsAnalysisArray = Array.from(reasonsAnalysis, ([reason, count]) => ({
    reason,
    count,
    percentage: (count / rejectedClaims) * 100
  })).sort((a, b) => b.count - a.count);

  // Analyze providers with highest rejection rates
  const providersAnalysis = d3.rollup(
    data.filter(row => row.claimStatus === 'Rejected'),
    v => v.length,
    d => d.providerName
  );

  const providersAnalysisArray = Array.from(providersAnalysis, ([provider, count]) => ({
    provider,
    rejectionCount: count,
    percentage: (count / rejectedClaims) * 100,
    topReasons: d3.rollup(
      data.filter(row => row.claimStatus === 'Rejected' && row.providerName === provider),
      v => v.length,
      d => d.rejectionReason
    )
  })).sort((a, b) => b.rejectionCount - a.rejectionCount);

  // Analyze rejection trends over time
  const timeAnalysis = d3.rollup(
    data.filter(row => row.claimStatus === 'Rejected'),
    v => v.length,
    d => d.claimDate.substring(0, 7) // Group by month
  );

  const timeAnalysisArray = Array.from(timeAnalysis, ([month, count]) => ({
    month,
    total: data.filter(row => row.claimDate.substring(0, 7) === month).length,
    rejected: count,
    rejectionRate: (count / data.filter(row => row.claimDate.substring(0, 7) === month).length) * 100
  })).sort((a, b) => new Date(a.month) - new Date(b.month));

  return {
    overallStats: {
      totalClaims,
      rejectedClaims,
      rejectionRate
    },
    reasonsAnalysis: reasonsAnalysisArray,
    providersAnalysis: providersAnalysisArray,
    timeAnalysis: {
      byMonth: timeAnalysisArray
    }
  };
}
