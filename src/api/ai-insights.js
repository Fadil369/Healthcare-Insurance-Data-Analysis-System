import { OpenAI } from 'openai';

/**
 * Generate AI-powered insights from analysis results
 * @param {Request} request - The request object
 * @returns {Response} AI-generated insights
 */
export async function generateAiInsights(request) {
  try {
    const { analysisResults, apiKey } = await request.json();
    
    if (!analysisResults) {
      return new Response(
        JSON.stringify({ error: 'No analysis results provided for AI insights' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is required for AI insights' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    // Prepare the analysis data as a concise summary
    const analysisPrompt = prepareAnalysisPrompt(analysisResults);
    
    // Generate insights
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert healthcare insurance analyst. Analyze the insurance claims data provided and generate actionable insights focusing on rejection patterns, trends, and recommendations for improving claim acceptance rates."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });
    
    const insights = chatCompletion.choices[0].message.content;
    
    // Generate recommendations
    const recommendationsCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert healthcare insurance analyst. Based on the insurance claims analysis, provide specific, actionable recommendations to improve claim acceptance rates and optimize the revenue cycle."
        },
        {
          role: "user",
          content: `Based on this analysis, provide 3-5 specific, actionable recommendations to improve claim acceptance rates:\n\n${analysisPrompt}`
        }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });
    
    const recommendations = recommendationsCompletion.choices[0].message.content;
    
    return new Response(
      JSON.stringify({ 
        insights,
        recommendations,
        generatedAt: new Date().toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error generating AI insights:', error);
    
    // Check for OpenAI-specific errors
    if (error.response && error.response.status) {
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error (${error.response.status}): ${error.message}`,
          details: error.response.data
        }),
        { status: error.response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Failed to generate AI insights: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Prepare a concise prompt from analysis results for the AI
 * @param {Object} results - The analysis results
 * @returns {string} Formatted prompt for the AI
 */
function prepareAnalysisPrompt(results) {
  let prompt = "Healthcare Insurance Claims Analysis Summary:\n\n";
  
  // Add overall stats if available
  if (results.overallStats) {
    prompt += "Overall Statistics:\n";
    prompt += `- Total Claims: ${results.overallStats.totalClaims}\n`;
    prompt += `- Rejected Claims: ${results.overallStats.rejectedClaims}\n`;
    prompt += `- Rejection Rate: ${results.overallStats.rejectionRate.toFixed(2)}%\n`;
    
    if (results.overallStats.averageProcessingDays) {
      prompt += `- Average Processing Days: ${results.overallStats.averageProcessingDays.toFixed(1)}\n`;
    }
    
    prompt += "\n";
  }
  
  // Add rejection reasons if available
  if (results.reasonsAnalysis && results.reasonsAnalysis.length > 0) {
    prompt += "Top Rejection Reasons:\n";
    
    results.reasonsAnalysis.slice(0, 5).forEach((reason, index) => {
      prompt += `${index + 1}. ${reason.reason}: ${reason.count} claims (${reason.percentage.toFixed(2)}%)\n`;
    });
    
    prompt += "\n";
  }
  
  // Add provider analysis if available
  if (results.providersAnalysis && results.providersAnalysis.length > 0) {
    prompt += "Providers with Highest Rejection Rates:\n";
    
    results.providersAnalysis.slice(0, 3).forEach((provider, index) => {
      prompt += `${index + 1}. ${provider.provider}: ${provider.rejectionCount} rejections (${provider.percentage.toFixed(2)}%)\n`;
      
      if (provider.topReasons && provider.topReasons.length > 0) {
        prompt += `   Top reason: ${provider.topReasons[0].reason} (${provider.topReasons[0].count} claims)\n`;
      }
    });
    
    prompt += "\n";
  }
  
  // Add time-based analysis if available
  if (results.timeAnalysis && results.timeAnalysis.byMonth && results.timeAnalysis.byMonth.length > 0) {
    prompt += "Rejection Trends Over Time:\n";
    
    // Get first and last month for trend direction
    const months = results.timeAnalysis.byMonth;
    const firstMonth = months[0];
    const lastMonth = months[months.length - 1];
    
    prompt += `- First Month (${firstMonth.month}): ${firstMonth.rejectionRate.toFixed(2)}% rejection rate\n`;
    prompt += `- Last Month (${lastMonth.month}): ${lastMonth.rejectionRate.toFixed(2)}% rejection rate\n`;
    
    // Calculate trend
    const trend = lastMonth.rejectionRate - firstMonth.rejectionRate;
    prompt += `- Overall Trend: ${trend > 0 ? 'Increasing' : trend < 0 ? 'Decreasing' : 'Stable'} rejection rate `;
    prompt += `(${Math.abs(trend).toFixed(2)}% ${trend > 0 ? 'increase' : 'decrease'})\n\n`;
  }
  
  return prompt;
}
