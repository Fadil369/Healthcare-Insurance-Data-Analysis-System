const assert = require('assert');
const { analyzeRejectionPatterns } = require('../src/analysis/rejection-analysis');
const { analyzeTrendPatterns } = require('../src/analysis/trend-analysis');
const { generateAiInsights } = require('../src/api/ai-insights');
const { generateReport } = require('../src/api/report-generator');
const { handleFileUpload } = require('../src/api/upload');

describe('Healthcare Insurance Data Analysis System', function() {
  describe('Rejection Analysis', function() {
    it('should analyze rejection patterns correctly', function() {
      const data = [
        { claimStatus: 'Rejected', rejectionReason: 'Missing Information', providerName: 'Provider A', claimDate: '2024-01-01' },
        { claimStatus: 'Rejected', rejectionReason: 'Service Not Covered', providerName: 'Provider B', claimDate: '2024-01-02' },
        { claimStatus: 'Approved', rejectionReason: '', providerName: 'Provider A', claimDate: '2024-01-03' },
      ];
      const result = analyzeRejectionPatterns(data);
      assert.strictEqual(result.overallStats.totalClaims, 3);
      assert.strictEqual(result.overallStats.rejectedClaims, 2);
      assert.strictEqual(result.reasonsAnalysis.length, 2);
    });
  });

  describe('Trend Analysis', function() {
    it('should analyze trends correctly', function() {
      const data = [
        { claimStatus: 'Rejected', claimDate: '2024-01-01', claimAmount: 100, paidAmount: 80, payerName: 'Payer A' },
        { claimStatus: 'Approved', claimDate: '2024-01-02', claimAmount: 200, paidAmount: 180, payerName: 'Payer B' },
        { claimStatus: 'Rejected', claimDate: '2024-02-01', claimAmount: 150, paidAmount: 120, payerName: 'Payer A' },
      ];
      const result = analyzeTrendPatterns(data);
      assert.strictEqual(result.monthlyTrends.length, 2);
      assert.strictEqual(result.payerTrends.length, 2);
    });
  });

  describe('AI Insights', function() {
    it('should generate AI insights correctly', async function() {
      const analysisResults = {
        overallStats: { totalClaims: 3, rejectedClaims: 2, rejectionRate: 66.67 },
        reasonsAnalysis: [{ reason: 'Missing Information', count: 1, percentage: 50 }],
        providersAnalysis: [{ provider: 'Provider A', rejectionCount: 1, percentage: 50, topReasons: [{ reason: 'Missing Information', count: 1 }] }],
        timeAnalysis: { byMonth: [{ month: '2024-01', total: 2, rejected: 1, rejectionRate: 50 }] }
      };
      const apiKey = 'test-api-key';
      const result = await generateAiInsights({ json: async () => ({ analysisResults, apiKey }) });
      assert.ok(result);
    });
  });

  describe('Report Generation', function() {
    it('should generate JSON report correctly', async function() {
      const analysisResults = {
        overallStats: { totalClaims: 3, rejectedClaims: 2, rejectionRate: 66.67 },
        reasonsAnalysis: [{ reason: 'Missing Information', count: 1, percentage: 50 }],
        providersAnalysis: [{ provider: 'Provider A', rejectionCount: 1, percentage: 50, topReasons: [{ reason: 'Missing Information', count: 1 }] }],
        timeAnalysis: { byMonth: [{ month: '2024-01', total: 2, rejected: 1, rejectionRate: 50 }] }
      };
      const result = await generateReport({ json: async () => ({ analysisResults, reportType: 'json' }) });
      assert.ok(result);
    });

    it('should generate CSV report correctly', async function() {
      const analysisResults = {
        overallStats: { totalClaims: 3, rejectedClaims: 2, rejectionRate: 66.67 },
        reasonsAnalysis: [{ reason: 'Missing Information', count: 1, percentage: 50 }],
        providersAnalysis: [{ provider: 'Provider A', rejectionCount: 1, percentage: 50, topReasons: [{ reason: 'Missing Information', count: 1 }] }],
        timeAnalysis: { byMonth: [{ month: '2024-01', total: 2, rejected: 1, rejectionRate: 50 }] }
      };
      const result = await generateReport({ json: async () => ({ analysisResults, reportType: 'csv' }) });
      assert.ok(result);
    });
  });

  describe('File Upload', function() {
    it('should handle Excel file upload correctly', async function() {
      const file = new Blob([new ArrayBuffer(10)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const formData = new FormData();
      formData.append('file', file, 'test.xlsx');
      const result = await handleFileUpload({ formData: async () => formData });
      assert.ok(result);
    });

    it('should handle PDF file upload correctly', async function() {
      const file = new Blob([new ArrayBuffer(10)], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', file, 'test.pdf');
      const result = await handleFileUpload({ formData: async () => formData });
      assert.ok(result);
    });
  });
});
