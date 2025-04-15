
export const printStyles = `
  /* Base styles for both preview and print */
  @page { 
    size: A4; 
    margin: 10mm; 
  }
  
  body { 
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    font-family: 'Inter', system-ui, sans-serif;
    background-color: white;
    margin: 0;
    padding: 0;
  }
  
  /* Container */
  .print-container {
    max-width: 100%;
    margin: 0 auto;
    padding: 20px;
    background-color: white;
    font-size: 12px;
  }
  
  /* Header section */
  .print-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 15px;
  }
  
  .print-header-logo {
    display: flex;
    align-items: center;
  }
  
  .print-header-company {
    text-align: right;
    font-size: 12px;
  }
  
  /* Title section */
  .print-title {
    text-align: center;
    margin-bottom: 20px;
  }
  
  .print-title h1 {
    display: inline-block;
    font-size: 20px;
    font-weight: bold;
    border: 1px solid #d1d5db;
    padding: 5px 15px;
    margin-bottom: 5px;
  }
  
  .print-title p {
    font-size: 11px;
    margin-top: 2px;
  }
  
  /* Card sections */
  .print-card {
    border: 1px solid #d1d5db;
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 15px;
    background-color: white;
  }
  
  .print-card-title {
    font-weight: bold;
    font-size: 14px;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 5px;
    margin-bottom: 8px;
  }
  
  .print-card-content {
    font-size: 12px;
  }
  
  /* Grid layout */
  .print-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  /* Tables */
  .print-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
    font-size: 11px;
  }
  
  .print-table th {
    background-color: #f3f4f6;
    font-weight: 600;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #d1d5db;
  }
  
  .print-table td {
    padding: 6px 8px;
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
    font-size: 12px;
  }
  
  .print-financial-summary td {
    padding: 4px 0;
    border: none;
  }
  
  .print-financial-summary .summary-total {
    border-top: 1px solid #d1d5db;
    font-weight: bold;
    padding-top: 8px;
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
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
  }
  
  /* Footer */
  .print-footer {
    margin-top: 20px;
    padding-top: 10px;
    border-top: 1px solid #d1d5db;
    text-align: center;
    font-size: 11px;
    color: #6b7280;
  }

  /* For when we're not printing */
  @media screen {
    body {
      background-color: #f5f5f5;
      padding: 20px;
    }
    
    .print-container {
      max-width: 210mm;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      margin: 0 auto;
    }
  }
  
  /* For when we are printing */
  @media print {
    .print-container {
      box-shadow: none;
    }
    
    /* These elements will still have the classes from Tailwind */
    .flex { display: flex !important; }
    .items-start { align-items: flex-start !important; }
    .items-center { align-items: center !important; }
    .justify-between { justify-content: space-between !important; }
    
    .grid { display: grid !important; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .gap-2 { gap: 0.5rem !important; }
    
    .text-left { text-align: left !important; }
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    
    .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
    .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
    .text-base { font-size: 1rem !important; line-height: 1.5rem !important; }
    .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
    .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
    
    .font-medium { font-weight: 500 !important; }
    .font-semibold { font-weight: 600 !important; }
    .font-bold { font-weight: 700 !important; }
    
    .border { border-width: 1px !important; border-style: solid !important; border-color: #d1d5db !important; }
    .border-t { border-top-width: 1px !important; border-top-style: solid !important; border-top-color: #d1d5db !important; }
    .border-b { border-bottom-width: 1px !important; border-bottom-style: solid !important; border-bottom-color: #d1d5db !important; }
    
    .bg-white { background-color: white !important; }
    .bg-gray-50 { background-color: #f9fafb !important; }
    .bg-gray-100 { background-color: #f3f4f6 !important; }
    
    .rounded { border-radius: 0.25rem !important; }
    
    table { page-break-inside: auto !important; }
    tr { page-break-inside: avoid !important; page-break-after: auto !important; }
  }
`;
