/**
 * Healthcare Insurance Data Analyzer
 * Main application JavaScript
 */

// Store application state
const appState = {
  currentSection: 'welcome',
  uploadedData: null,
  analysisResults: null,
  charts: {},
};

// DOM Element References
const elements = {
  sections: {
    welcome: document.getElementById('welcome-section'),
    upload: document.getElementById('upload-section'),
    dashboard: document.getElementById('dashboard-section'),
    insights: document.getElementById('insights-section'),
    reports: document.getElementById('reports-section'),
    loading: document.getElementById('main-loading')
  },
  navigation: {
    dashboardLink: document.getElementById('dashboard-link'),
    uploadLink: document.getElementById('upload-link'),
    reportsLink: document.getElementById('reports-link'),
    insightsLink: document.getElementById('insights-link'),
    getStartedBtn: document.getElementById('get-started-btn'),
    learnMoreBtn: document.getElementById('learn-more-btn')
  },
  upload: {
    dropzone: document.getElementById('file-dropzone'),
    fileInput: document.getElementById('file-input'),
    progressBar: document.getElementById('upload-progress'),
    progressBarInner: document.querySelector('#upload-progress .progress-bar'),
    alert: document.getElementById('upload-alert')
  },
  dashboard: {
    totalClaims: document.getElementById('total-claims'),
    rejectionRate: document.getElementById('rejection-rate'),
    totalAmount: document.getElementById('total-amount'),
    processingTime: document.getElementById('processing-time'),
    claimsChange: document.getElementById('claims-change'),
    rejectionChange: document.getElementById('rejection-change'),
    amountChange: document.getElementById('amount-change'),
    processingChange: document.getElementById('processing-change'),
    trendChart: document.getElementById('trend-chart-canvas'),
    rejectionChart: document.getElementById('rejection-chart-canvas'),
    payerChart: document.getElementById('payer-chart-canvas'),
    rejectionReasons: document.getElementById('rejection-reasons-container'),
    rejectionReasonsLoading: document.getElementById('rejection-reasons-loading')
  },
  insights: {
    apiKeyInput: document.getElementById('openai-api-key'),
    generateBtn: document.getElementById('generate-insights-btn'),
    refreshBtn: document.getElementById('refresh-insights-btn'),
    loading: document.getElementById('insights-loading'),
    container: document.getElementById('ai-insights-container'),
    insightsContent: document.getElementById('ai-insights-content'),
    recommendationsContent: document.getElementById('ai-recommendations-content')
  },
  reports: {
    form: document.getElementById('report-form'),
    generateBtn: document.getElementById('generate-report-btn'),
    reportsList: document.getElementById('reports-list')
  }
};

// Initialize the application
function initApp() {
  // Set up event listeners
  setupEventListeners();
  
  // Check for any saved data in localStorage
  loadSavedState();
  
  // Initialize charts
  initCharts();
}

// Set up all event listeners
function setupEventListeners() {
  // Navigation
  elements.navigation.uploadLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('upload');
  });
  
  elements.navigation.dashboardLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('dashboard');
  });
  
  elements.navigation.reportsLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('reports');
  });
  
  elements.navigation.insightsLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('insights');
  });
  
  elements.navigation.getStartedBtn.addEventListener('click', () => {
    showSection('upload');
  });
  
  // File upload
  elements.upload.dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.upload.dropzone.classList.add('active');
  });
  
  elements.upload.dropzone.addEventListener('dragleave', () => {
    elements.upload.dropzone.classList.remove('active');
  });
  
  elements.upload.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.upload.dropzone.classList.remove('active');
    
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });
  
  elements.upload.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });
  
  // AI Insights
  elements.insights.generateBtn.addEventListener('click', generateAiInsights);
  elements.insights.refreshBtn.addEventListener('click', generateAiInsights);
  
  // Reports
  elements.reports.generateBtn.addEventListener('click', generateReport);
}

// Show a specific section and hide others
function showSection(sectionName) {
  // Hide all sections
  Object.values(elements.sections).forEach(section => {
    if (section) section.style.display = 'none';
  });
  
  // Update navigation active state
  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Show the requested section
  if (elements.sections[sectionName]) {
    elements.sections[sectionName].style.display = 'block';
    appState.currentSection = sectionName;
    
    // Update active nav link
    const navLinkId = `${sectionName}-link`;
    if (elements.navigation[navLinkId]) {
      elements.navigation[navLinkId].classList.add('active');
    }
    
    // Special handling for dashboard - update charts
    if (sectionName === 'dashboard' && appState.analysisResults) {
      updateDashboard(appState.analysisResults);
    }
  }
}

// Save application state to localStorage
function saveState() {
  localStorage.setItem('healthcareAnalyzerState', JSON.stringify({
    currentSection: appState.currentSection,
    analysisResults: appState.analysisResults
  }));
}

// Load saved state from localStorage
function loadSavedState() {
  try {
    const savedState = localStorage.getItem('healthcareAnalyzerState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      
      if (parsedState.analysisResults) {
        appState.analysisResults = parsedState.analysisResults;
        
        // If we have analysis results, enable dashboard and show it
        showSection(parsedState.currentSection || 'dashboard');
      }
    }
  } catch (error) {
    console.error('Error loading saved state:', error);
  }
}

// Handle file upload and processing
async function handleFileUpload(file) {
  try {
    // Show progress
    elements.upload.progressBar.style.display = 'block';
    elements.upload.progressBarInner.style.width = '10%';
    elements.upload.alert.style.display = 'none';
    
    // Validate file type
    const fileType = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'pdf'].includes(fileType)) {
      showUploadError('Invalid file type. Please upload Excel (.xlsx, .xls) or PDF files.');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showUploadError('File is too large. Maximum size is 10MB.');
      return;
    }
    
    // Update progress
    elements.upload.progressBarInner.style.width = '30%';
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload file
    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    // Update progress
    elements.upload.progressBarInner.style.width = '60%';
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || 'Failed to upload file');
    }
    
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to process file');
    }
    
    // Process the extracted data
    elements.upload.progressBarInner.style.width = '80%';
    
    // Simulate analysis for now
    // In production, you'd make an API call to analyze the data
    const analysisResponse = await analyzeData(uploadResult.resultId, fileType);
    
    // Update progress
    elements.upload.progressBarInner.style.width = '100%';
    
    // Store the results
    appState.uploadedData = uploadResult;
    appState.analysisResults = analysisResponse;
    
    // Save state
    saveState();
    
    // Show success message
    elements.upload.alert.className = 'alert alert-success';
    elements.upload.alert.textContent = 'File processed successfully!';
    elements.upload.alert.style.display = 'block';
    
    // After a short delay, transition to the dashboard
    setTimeout(() => {
      showSection('dashboard');
    }, 1500);
    
  } catch (error) {
    console.error('Error uploading file:', error);
    showUploadError(error.message || 'Failed to process file');
  }
}

// Show upload error
function showUploadError(message) {
  elements.upload.progressBar.style.display = 'none';
  elements.upload.alert.className = 'alert alert-danger';
  elements.upload.alert.textContent = message;
  elements.upload.alert.style.display = 'block';
}

// Simulate data analysis
// In production, this would make API calls to your backend
async function analyzeData(resultId, fileType) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For demo purposes, generate mock data
  // In production, you'd fetch this from your API
  return generateMockAnalysis(fileType);
}

// Initialize charts
function initCharts() {
  // Create empty charts - they'll be populated with data later
  appState.charts.trend = new Chart(elements.dashboard.trendChart, {
    type: 'line',
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Monthly Trends'
        }
      }
    }
  });
  
  appState.charts.rejection = new Chart(elements.dashboard.rejectionChart, {
    type: 'bar',
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Rejection Analysis'
        }
      }
    }
  });
  
  appState.charts.payer = new Chart(elements.dashboard.payerChart, {
    type: 'horizontalBar',
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: 'Payer Analysis'
        }
      }
    }
  });
}

// Update dashboard with analysis results
function updateDashboard(results) {
  if (!results) return;
  
  // Update stats
  if (results.overallStats) {
    elements.dashboard.totalClaims.textContent = results.overallStats.totalClaims.toLocaleString();
    elements.dashboard.rejectionRate.textContent = `${results.overallStats.rejectionRate.toFixed(1)}%`;
    
    if (results.overallStats.totalAmount) {
      elements.dashboard.totalAmount.textContent = `$${results.overallStats.totalAmount.toLocaleString()}`;
    }
    
    if (results.overallStats.averageProcessingDays) {
      elements.dashboard.processingTime.textContent = `${results.overallStats.averageProcessingDays.toFixed(1)} days`;
    }
  }
  
  // Update trend chart
  if (results.monthlyTrends && results.monthlyTrends.byMonth) {
    updateTrendChart(results.monthlyTrends.byMonth);
  }
  
  // Update rejection chart
  if (results.reasonsAnalysis) {
    updateRejectionChart(results.reasonsAnalysis);
    updateRejectionReasons(results.reasonsAnalysis);
  }
  
  // Update payer chart
  if (results.payerTrends) {
    updatePayerChart(results.payerTrends);
  }
}

// Update trend chart
function updateTrendChart(monthlyData) {
  const chart = appState.charts.trend;
  const labels = monthlyData.map(item => item.month);
  
  chart.data.labels = labels;
  chart.data.datasets = [
    {
      label: 'Total Claims',
      data: monthlyData.map(item => item.totalClaims),
      borderColor: '#3f51b5',
      backgroundColor: 'rgba(63, 81, 181, 0.1)',
      tension: 0.4,
      fill: true
    },
    {
      label: 'Rejection Rate (%)',
      data: monthlyData.map(item => item.rejectionRate),
      borderColor: '#f50057',
      backgroundColor: 'rgba(245, 0, 87, 0.1)',
      tension: 0.4,
      fill: true,
      yAxisID: 'y1'
    }
  ];
  
  chart.options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total Claims'
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        title: {
          display: true,
          text: 'Rejection Rate (%)'
        },
        max: 100,
        grid: {
          drawOnChartArea: false
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Monthly Claim Trends'
      }
    }
  };
  
  chart.update();
}

// Update rejection chart
function updateRejectionChart(reasonsData) {
  const chart = appState.charts.rejection;
  
  // Get top 6 reasons
  const topReasons = reasonsData.slice(0, 6);
  const labels = topReasons.map(item => item.reason);
  
  chart.data.labels = labels;
  chart.data.datasets = [
    {
      label: 'Rejected Claims',
      data: topReasons.map(item => item.count),
      backgroundColor: 'rgba(245, 0, 87, 0.7)',
      borderColor: 'rgba(245, 0, 87, 1)',
      borderWidth: 1
    }
  ];
  
  chart.options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Claims'
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Top Rejection Reasons'
      }
    }
  };
  
  chart.update();
}

// Update payer chart
function updatePayerChart(payerData) {
  const chart = appState.charts.payer;
  
  // Get top 6 payers
  const topPayers = payerData.slice(0, 6);
  const labels = topPayers.map(item => item.payer);
  
  chart.data.labels = labels;
  chart.data.datasets = [
    {
      label: 'Rejection Rate (%)',
      data: topPayers.map(item => item.rejectionRate),
      backgroundColor: 'rgba(63, 81, 181, 0.7)',
      borderColor: 'rgba(63, 81, 181, 1)',
      borderWidth: 1
    }
  ];
  
  chart.options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Rejection Rate (%)'
        },
        max: 100
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Rejection Rate by Payer'
      }
    }
  };
  
  chart.update();
}

// Update rejection reasons widget
function updateRejectionReasons(reasonsData) {
  const container = elements.dashboard.rejectionReasons;
  
  // Hide loading spinner
  elements.dashboard.rejectionReasonsLoading.style.display = 'none';
  
  // Clear previous content
  container.innerHTML = '';
  
  // Get top 6 reasons
  const topReasons = reasonsData.slice(0, 6);
  
  // Generate HTML for each reason
  topReasons.forEach(reason => {
    const reasonDiv = document.createElement('div');
    reasonDiv.className = 'rejection-reason';
    
    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-center';
    
    const reasonName = document.createElement('div');
    reasonName.textContent = reason.reason;
    
    const percentage = document.createElement('div');
    percentage.className = 'text-muted';
    percentage.textContent = `${reason.percentage.toFixed(1)}%`;
    
    header.appendChild(reasonName);
    header.appendChild(percentage);
    
    const progressBar = document.createElement('div');
    progressBar.className = 'progress progress-thin';
    
    const progressBarInner = document.createElement('div');
    progressBarInner.className = 'progress-bar bg-danger';
    progressBarInner.style.width = `${reason.percentage}%`;
    
    progressBar.appendChild(progressBarInner);
    
    reasonDiv.appendChild(header);
    reasonDiv.appendChild(progressBar);
    
    container.appendChild(reasonDiv);
  });
}

// Generate AI insights
async function generateAiInsights() {
  try {
    // Check if we have analysis results
    if (!appState.analysisResults) {
      alert('Please upload and analyze data first');
      return;
    }
    
    // Get API key
    const apiKey = elements.insights.apiKeyInput.value.trim();
    if (!apiKey) {
      alert('Please enter your OpenAI API key');
      return;
    }
    
    // Show loading state
    elements.insights.loading.style.display = 'block';
    elements.insights.container.style.display = 'none';
    
    // Make API request
    const response = await fetch('/api/insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        analysisResults: appState.analysisResults,
        apiKey
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate insights');
    }
    
    const insightsResult = await response.json();
    
    // Update the UI with insights
    elements.insights.insightsContent.innerHTML = insightsResult.insights.replace(/\n/g, '<br>');
    elements.insights.recommendationsContent.innerHTML = insightsResult.recommendations.replace(/\n/g, '<br>');
    
    // Hide loading, show results
    elements.insights.loading.style.display = 'none';
    elements.insights.container.style.display = 'block';
    
  } catch (error) {
    console.error('Error generating AI insights:', error);
    alert('Failed to generate insights: ' + error.message);
    elements.insights.loading.style.display = 'none';
  }
}

// Generate report
async function generateReport() {
  try {
    // Check if we have analysis results
    if (!appState.analysisResults) {
      alert('Please upload and analyze data first');
      return;
    }
    
    // Get report type
    const reportType = document.querySelector('input[name="reportType"]:checked').value;
    
    // Get included sections
    const sections = {
      overview: document.getElementById('include-overview').checked,
      rejections: document.getElementById('include-rejections').checked,
      trends: document.getElementById('include-trends').checked,
      payers: document.getElementById('include-payers').checked
    };
    
    // Filter analysis results based on included sections
    const filteredResults = {};
    
    if (sections.overview && appState.analysisResults.overallStats) {
      filteredResults.overallStats = appState.analysisResults.overallStats;
    }
    
    if (sections.rejections) {
      if (appState.analysisResults.reasonsAnalysis) {
        filteredResults.reasonsAnalysis = appState.analysisResults.reasonsAnalysis;
      }
      if (appState.analysisResults.providersAnalysis) {
        filteredResults.providersAnalysis = appState.analysisResults.providersAnalysis;
      }
    }
    
    if (sections.trends && appState.analysisResults.monthlyTrends) {
      filteredResults.monthlyTrends = appState.analysisResults.monthlyTrends;
    }
    
    if (sections.payers && appState.analysisResults.payerTrends) {
      filteredResults.payerTrends = appState.analysisResults.payerTrends;
    }
    
    // Make API request to generate the report
    const response = await fetch('/api/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        analysisResults: filteredResults,
        reportType
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate report');
    }
    
    // Get the blob from the response
    const blob = await response.blob();
    
    // Create a download link and trigger it
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `insurance-analysis-report.${reportType}`;
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    // Add to reports list (for demo purposes)
    addReportToList(reportType);
    
  } catch (error) {
    console.error('Error generating report:', error);
    alert('Failed to generate report: ' + error.message);
  }
}

// Add a report to the reports list
function addReportToList(reportType) {
  const now = new Date();
  const dateStr = now.toLocaleString();
  
  // Clear the "no reports" message if it exists
  if (elements.reports.reportsList.querySelector('.text-muted')) {
    elements.reports.reportsList.innerHTML = '';
  }
  
  // Create the report list item
  const reportItem = document.createElement('a');
  reportItem.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
  reportItem.href = '#';
  
  const reportInfo = document.createElement('div');
  
  const reportTitle = document.createElement('h6');
  reportTitle.className = 'mb-1';
  reportTitle.textContent = `Insurance Analysis Report (${reportType.toUpperCase()})`;
  
  const reportDate = document.createElement('small');
  reportDate.className = 'text-muted';
  reportDate.textContent = dateStr;
  
  reportInfo.appendChild(reportTitle);
  reportInfo.appendChild(reportDate);
  
  const downloadIcon = document.createElement('i');
  downloadIcon.className = 'bi bi-download';
  
  reportItem.appendChild(reportInfo);
  reportItem.appendChild(downloadIcon);
  
  // Add to the list
  elements.reports.reportsList.insertBefore(reportItem, elements.reports.reportsList.firstChild);
}

// Generate mock analysis data for testing
function generateMockAnalysis(fileType) {
  const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];
  const rejectionReasons = [
    'Missing Information', 
    'Duplicate Claim', 
    'Service Not Covered',
    'Authorization Required',
    'Incorrect Coding',
    'Coordination of Benefits',
    'Eligibility Expired',
    'Timely Filing',
    'Invalid NPI'
  ];
  const payers = [
    'Blue Cross Blue Shield',
    'UnitedHealthcare',
    'Aetna',
    'Cigna',
    'Humana',
    'Medicare',
    'Medicaid',
    'Kaiser Permanente'
  ];
  
  // Create monthly data with some realistic trends
  const monthlyData = months.map((month, index) => {
    const baseClaimCount = 500 + Math.floor(Math.random() * 200);
    const growthFactor = 1 + (index * 0.05); // 5% growth per month
    const totalClaims = Math.floor(baseClaimCount * growthFactor);
    
    // Rejection rate starts higher and improves over time
    const rejectionRateBase = 12 - (index * 0.8);
    const rejectionRate = Math.max(5, rejectionRateBase + (Math.random() * 2 - 1));
    const rejectedClaims = Math.floor(totalClaims * (rejectionRate / 100));
    
    // Financial amounts
    const avgClaimAmount = 750 + Math.floor(Math.random() * 250);
    const totalAmount = totalClaims * avgClaimAmount;
    const paidAmount = totalAmount * (1 - (rejectionRate / 100)) * 0.8; // 80% of non-rejected
    
    return {
      month,
      totalClaims,
      rejectedClaims,
      rejectionRate,
      totalAmount,
      paidAmount,
      changes: index > 0 ? {
        totalClaims: totalClaims - monthlyData[index - 1].totalClaims,
        totalClaimsPercent: ((totalClaims - monthlyData[index - 1].totalClaims) / monthlyData[index - 1].totalClaims) * 100,
        rejectionRate: rejectionRate - monthlyData[index - 1].rejectionRate,
        totalAmount: totalAmount - monthlyData[index - 1].totalAmount,
        totalAmountPercent: ((totalAmount - monthlyData[index - 1].totalAmount) / monthlyData[index - 1].totalAmount) * 100
      } : {}
    };
  });
  
  // Create rejection reasons analysis
  const reasonsAnalysis = rejectionReasons.map(reason => {
    // Assign different frequencies to make it realistic
    const count = Math.floor(50 + Math.random() * 200);
    return {
      reason,
      count,
      percentage: (count / 1200) * 100 // 1200 is an estimate of total rejections
    };
  }).sort((a, b) => b.count - a.count);
  
  // Create providers analysis
  const providersAnalysis = [
    'Northeast Medical Center',
    'Westside Health Partners',
    'Southlake Hospital',
    'Metropolitan Specialists Group',
    'Valley Medical Associates',
    'Central City Healthcare'
  ].map(provider => {
    const rejectionCount = Math.floor(30 + Math.random() * 120);
    const totalProviderClaims = Math.floor(200 + Math.random() * 300);
    
    // Get random top reasons for this provider
    const shuffledReasons = [...rejectionReasons].sort(() => 0.5 - Math.random());
    const topReasons = shuffledReasons.slice(0, 3).map(reason => {
      const count = Math.floor(5 + Math.random() * (rejectionCount / 3));
      return { reason, count };
    }).sort((a, b) => b.count - a.count);
    
    return {
      provider,
      rejectionCount,
      topReasons,
      percentage: (rejectionCount / totalProviderClaims) * 100
    };
  }).sort((a, b) => b.rejectionCount - a.rejectionCount);
  
  // Create payer analysis
  const payerTrends = payers.map(payer => {
    const totalClaims = Math.floor(200 + Math.random() * 500);
    const rejectionRate = 5 + Math.random() * 15;
    const rejectedClaims = Math.floor(totalClaims * (rejectionRate / 100));
    const avgClaimAmount = 500 + Math.floor(Math.random() * 500);
    const totalAmount = totalClaims * avgClaimAmount;
    const payoutRatio = 70 + Math.random() * 20; // 70-90%
    const paidAmount = totalAmount * (payoutRatio / 100);
    
    return {
      payer,
      totalClaims,
      rejectedClaims,
      rejectionRate,
      totalAmount,
      paidAmount,
      averagePaidAmount: paidAmount / totalClaims
    };
  }).sort((a, b) => b.totalClaims - a.totalClaims);
  
  // Calculate overall stats
  const totalClaims = monthlyData.reduce((sum, month) => sum + month.totalClaims, 0);
  const totalRejectedClaims = monthlyData.reduce((sum, month) => sum + month.rejectedClaims, 0);
  const rejectionRate = (totalRejectedClaims / totalClaims) * 100;
  const totalAmount = monthlyData.reduce((sum, month) => sum + month.totalAmount, 0);
  
  return {
    overallStats: {
      totalClaims,
      rejectedClaims: totalRejectedClaims,
      rejectionRate,
      totalAmount,
      averageProcessingDays: 12.4
    },
    reasonsAnalysis,
    providersAnalysis,
    monthlyTrends: {
      byMonth: monthlyData
    },
    payerTrends,
    timeAnalysis: {
      byMonth: monthlyData.map(month => ({
        month: month.month,
        total: month.totalClaims,
        rejected: month.rejectedClaims,
        rejectionRate: month.rejectionRate
      }))
    }
  };
}

// Initialize the application
document.addEventListener('DOMContentLoaded', initApp);
