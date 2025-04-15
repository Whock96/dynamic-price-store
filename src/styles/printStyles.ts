
export const printStyles = `
  /* Base styles for both preview and print */
  @page { 
    size: A4; 
    margin: 5mm; 
  }
  
  body { 
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 10px;
    background-color: white;
    margin: 0;
    padding: 0;
  }
  
  /* Container */
  .print-container {
    max-width: 190mm;
    margin: 0 auto;
    padding: 8px;
    background-color: white;
  }
  
  /* Header section */
  .print-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 8px;
  }
  
  .print-header-logo {
    display: flex;
    align-items: center;
  }
  
  .print-header-logo img {
    width: 120px;
    height: 48px;
    object-fit: contain;
  }
  
  .print-header-company {
    text-align: right;
    font-size: 10px;
  }
  
  .print-header-company .company-name {
    font-size: 14px;
    font-weight: bold;
  }
  
  /* Title section */
  .print-title {
    text-align: center;
    margin-bottom: 12px;
  }
  
  .print-title h1 {
    display: inline-block;
    font-size: 16px;
    font-weight: bold;
    border: 1px solid #d1d5db;
    padding: 4px 12px;
    margin-bottom: 4px;
  }
  
  .print-title p {
    font-size: 10px;
    margin-top: 2px;
  }
  
  /* Card sections */
  .print-card {
    border: 1px solid #d1d5db;
    border-radius: 4px;
    padding: 8px;
    margin-bottom: 8px;
  }
  
  .print-card-title {
    font-weight: bold;
    font-size: 12px;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 4px;
    margin-bottom: 6px;
  }
  
  .print-card-content {
    font-size: 10px;
  }
  
  /* Grid layout */
  .print-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  /* Tables */
  .print-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
    font-size: 10px;
  }
  
  .print-table th {
    background-color: #f3f4f6;
    font-weight: 600;
    text-align: left;
    padding: 4px 6px;
    border: 1px solid #d1d5db;
  }
  
  .print-table td {
    padding: 4px 6px;
    border: 1px solid #d1d5db;
    vertical-align: top;
  }
  
  .print-table th.align-right,
  .print-table td.align-right {
    text-align: right;
  }
  
  .print-table th.align-center,
  .print-table td.align-center {
    text-align: center;
  }
  
  /* Financial summary */
  .print-financial-summary {
    width: 100%;
    font-size: 10px;
  }
  
  .print-financial-summary td {
    padding: 2px 0;
    border: none;
  }
  
  .print-financial-summary .summary-total {
    border-top: 1px solid #d1d5db;
    font-weight: bold;
    padding-top: 4px;
  }
  
  /* Text colors */
  .text-red { color: #dc2626; }
  .text-blue { color: #2563eb; }
  .text-orange { color: #ea580c; }
  
  /* Text weights */
  .font-medium { font-weight: 500; }
  .font-semibold { font-weight: 600; }
  .font-bold { font-weight: 700; }
  
  /* Notes section */
  .print-notes {
    border: 1px solid #d1d5db;
    background-color: #f9fafb;
    padding: 6px;
    border-radius: 4px;
    font-size: 10px;
  }
  
  /* Footer */
  .print-footer {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #d1d5db;
    text-align: center;
    font-size: 10px;
    color: #6b7280;
  }

  /* For when we're not printing */
  @media screen {
    body {
      background-color: #f5f5f5;
      padding: 16px;
    }
    
    .print-container {
      max-width: 190mm;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      margin: 0 auto;
    }
  }
  
  /* For when we are printing */
  @media print {
    .print-container {
      box-shadow: none;
      max-width: none !important;
      width: 100% !important;
      padding: 0 !important;
    }
    
    table { 
      table-layout: fixed !important;
      width: 100% !important;
    }
  }
`;

