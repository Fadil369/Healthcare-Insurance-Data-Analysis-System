import { Router } from 'itty-router';
import { handleFileUpload } from './api/upload';
import { processExcelData } from './data-extraction/excel-extractor';
import { processPdfData } from './data-extraction/pdf-extractor';
import { analyzeRejections } from './analysis/rejection-analysis';
import { analyzeTrends } from './analysis/trend-analysis';
import { generateReport } from './api/report-generator';
import { generateAiInsights } from './api/ai-insights';

// Create a new router
const router = Router();

// Serve static assets
const serveAsset = async (request, path) => {
  const url = new URL(request.url);
  const assetPath = path || url.pathname.substring(1) || 'index.html';
  
  // Fetch the asset from KV storage
  const asset = await HEALTH_INSURANCE_DATA.get(`assets:${assetPath}`, { type: 'arrayBuffer' });
  
  if (!asset) {
    return new Response('Not Found', { status: 404 });
  }
  
  // Set the appropriate content type based on file extension
  const extension = assetPath.split('.').pop();
  const contentType = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'svg': 'image/svg+xml',
  }[extension] || 'text/plain';
  
  return new Response(asset, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

// API Routes
router.post('/api/upload', handleFileUpload);
router.post('/api/analyze/rejections', analyzeRejections);
router.post('/api/analyze/trends', analyzeTrends);
router.post('/api/report', generateReport);
router.post('/api/insights', generateAiInsights);

// Static file route
router.get('*', serveAsset);

// Event handler
export default {
  async fetch(request, env, ctx) {
    // Make env vars available to our handlers
    globalThis.HEALTH_INSURANCE_DATA = env.HEALTH_INSURANCE_DATA;
    
    // Return the response from the router
    return router.handle(request, env, ctx)
      .catch(err => {
        console.error('Error handling request:', err);
        return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      });
  },
};
