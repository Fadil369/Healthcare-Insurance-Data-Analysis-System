import ExcelJS from 'exceljs';

/**
 * Extract data from Excel files
 * @param {ArrayBuffer} fileBuffer - The uploaded Excel file as an ArrayBuffer
 * @returns {Object} The extracted data and metadata
 */
export async function processExcelData(fileBuffer) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    
    const result = {
      sheets: [],
      summary: {
        totalSheets: workbook.worksheets.length,
        totalRows: 0,
        totalColumns: 0,
      }
    };
    
    // Process each worksheet
    workbook.worksheets.forEach(worksheet => {
      const sheetData = {
        name: worksheet.name,
        rows: [],
        rowCount: worksheet.rowCount,
        columnCount: worksheet.columnCount
      };
      
      // Update summary counts
      result.summary.totalRows += worksheet.rowCount;
      result.summary.totalColumns = Math.max(result.summary.totalColumns, worksheet.columnCount);
      
      // Get column headers (assuming first row contains headers)
      const headers = [];
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value ? cell.value.toString() : `Column${colNumber}`;
      });
      
      // Process each row
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          rowData[header] = cell.value;
        });
        
        sheetData.rows.push(rowData);
      });
      
      result.sheets.push(sheetData);
    });
    
    return result;
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw new Error('Failed to process Excel file: ' + error.message);
  }
}

/**
 * Clean and transform the extracted data
 * @param {Object} data - The raw extracted data
 * @returns {Object} Cleaned and transformed data
 */
export function cleanExcelData(data) {
  if (!data || !data.sheets || !data.sheets.length) {
    throw new Error('No valid Excel data to clean');
  }
  
  const cleanedData = {
    sheets: data.sheets.map(sheet => {
      // Clean sheet data
      const cleanedRows = sheet.rows.map(row => {
        const cleanedRow = {};
        
        // Process each column in the row
        Object.keys(row).forEach(key => {
          // Skip empty or null values
          if (row[key] === null || row[key] === undefined) return;
          
          let value = row[key];
          
          // Convert dates to ISO strings for consistency
          if (value instanceof Date) {
            cleanedRow[key] = value.toISOString();
          } 
          // Trim strings and standardize case for text fields
          else if (typeof value === 'string') {
            cleanedRow[key] = value.trim();
            
            // Standardize known fields
            if (key.toLowerCase().includes('code')) {
              cleanedRow[key] = value.toUpperCase();
            }
          } 
          // Keep numbers as is
          else {
            cleanedRow[key] = value;
          }
        });
        
        return cleanedRow;
      }).filter(row => Object.keys(row).length > 0); // Remove empty rows
      
      return {
        ...sheet,
        rows: cleanedRows
      };
    })
  };
  
  return cleanedData;
}
