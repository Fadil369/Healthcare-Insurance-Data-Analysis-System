/**
 * Handle file uploads for Excel and PDF files
 * @param {Request} request - The request object
 * @returns {Response} The response with processing results
 */
export async function handleFileUpload(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get file type from the filename
    const fileName = file.name || '';
    const fileType = fileName.split('.').pop().toLowerCase();
    
    // Import the right processor based on file type
    let result;
    
    if (fileType === 'xlsx' || fileType === 'xls') {
      const { processExcelData } = await import('../data-extraction/excel-extractor.js');
      const buffer = await file.arrayBuffer();
      result = await processExcelData(buffer);
    } 
    else if (fileType === 'pdf') {
      const { processPdfData } = await import('../data-extraction/pdf-extractor.js');
      const buffer = await file.arrayBuffer();
      result = await processPdfData(buffer);
    } 
    else {
      return new Response(
        JSON.stringify({ error: `Unsupported file type: ${fileType}. Please upload Excel (.xlsx, .xls) or PDF files.` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Store the extraction result in KV for later retrieval
    const resultId = crypto.randomUUID();
    await HEALTH_INSURANCE_DATA.put(`extraction:${resultId}`, JSON.stringify(result), { expirationTtl: 3600 });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        resultId,
        summary: result.summary || { fileType, fileName }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing file upload:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process file: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
