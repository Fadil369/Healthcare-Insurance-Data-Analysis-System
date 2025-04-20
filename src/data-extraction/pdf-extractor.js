import pdfParse from 'pdf-parse';

/**
 * Extract data from PDF files
 * @param {ArrayBuffer} fileBuffer - The uploaded PDF file as an ArrayBuffer
 * @returns {Object} The extracted data and metadata
 */
export async function processPdfData(fileBuffer) {
  try {
    const pdfData = await pdfParse(fileBuffer);
    
    const result = {
      text: pdfData.text,
      info: pdfData.info,
      metadata: {
        pageCount: pdfData.numpages,
        version: pdfData.info.PDFFormatVersion,
      },
      tables: extractTablesFromPdf(pdfData.text)
    };
    
    return result;
  } catch (error) {
    console.error('Error processing PDF file:', error);
    throw new Error('Failed to process PDF file: ' + error.message);
  }
}

/**
 * Extract tables from PDF text using heuristics
 * 
 * Note: This is a simplified approach. Production systems would use more 
 * sophisticated table extraction that might require server-side processing.
 * For Cloudflare Workers, we're implementing a lightweight approach.
 * 
 * @param {string} text - The raw PDF text content
 * @returns {Array} Array of extracted tables
 */
function extractTablesFromPdf(text) {
  const tables = [];
  
  // Split by potential table markers
  const lines = text.split('\n');
  
  let currentTable = null;
  let tableStartLineIndex = -1;
  
  // Detect potential tables based on line patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Potential table header detection
    // Check for lines with multiple word separations suggesting columns
    const wordGroups = line.split(/\s{2,}/);
    
    if (wordGroups.length >= 3) {
      // Potential table header found
      if (!currentTable) {
        currentTable = {
          headers: wordGroups.map(h => h.trim()).filter(h => h),
          rows: [],
          lineStart: i
        };
        tableStartLineIndex = i;
      } 
      // If we already have a table going, this might be a new row
      else if (i > tableStartLineIndex) {
        // Check if this line has the same number of columns (approximately)
        // as our detected table headers
        if (Math.abs(wordGroups.length - currentTable.headers.length) <= 1) {
          currentTable.rows.push(
            wordGroups.map(cell => cell.trim()).filter(cell => cell)
          );
        } 
        // If pattern changes significantly, maybe we're out of the table
        else if (i >= tableStartLineIndex + 2) {
          // Only save tables with at least one data row
          if (currentTable.rows.length > 0) {
            tables.push({...currentTable});
          }
          
          // Reset for the next potential table
          currentTable = null;
          tableStartLineIndex = -1;
          
          // Reprocess this line as a potential new table header
          i--;
        }
      }
    } 
    // If we have a table going but the pattern changed, we might be at the end
    else if (currentTable && i >= tableStartLineIndex + 2) {
      // Save the current table if it has rows
      if (currentTable.rows.length > 0) {
        tables.push({...currentTable});
      }
      
      // Reset for the next potential table
      currentTable = null;
      tableStartLineIndex = -1;
    }
  }
  
  // Don't forget to save the last table if we were tracking one
  if (currentTable && currentTable.rows.length > 0) {
    tables.push({...currentTable});
  }
  
  return tables;
}
