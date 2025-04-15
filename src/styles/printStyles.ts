
export const printStyles = `
  @page { 
    size: A4;
    margin: 4mm; /* Reduced from 5mm */
  }
  
  body { 
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 9px; /* Reduced from 10px */
    background-color: white;
    margin: 0;
    padding: 0;
  }
  
  .print-container {
    max-width: 190mm;
    margin: 0 auto;
    padding: 6px; /* Reduced from 8px */
    background-color: white;
  }
  
  .print-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 6px; /* Reduced from 8px */
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 6px;
  }
  
  .print-header-logo {
    display: flex;
    align-items: center;
  }
  
  .print-header-logo img {
    width: 100px; /* Reduced from 120px */
    height: 40px; /* Reduced from 48px */
    object-fit: contain;
  }
  
  .print-header-company {
    text-align: right;
    font-size: 9px;
  }
  
  .print-header-company .company-name {
    font-size: 12px; /* Reduced from 14px */
    font-weight: bold;
  }
  
  .print-title {
    text-align: center;
    margin-bottom: 8px; /* Reduced from 12px */
  }
  
  .print-title h1 {
    display: inline-block;
    font-size: 14px; /* Reduced from 16px */
    font-weight: bold;
    border: 1px solid #d1d5db;
    padding: 3px 10px;
    margin-bottom: 2px;
  }
  
  .print-title p {
    font-size: 9px;
    margin-top: 1px;
  }
  
  .print-card {
    border: 1px solid #d1d5db;
    border-radius: 3px;
    padding: 6px;
    margin-bottom: 6px;
  }
  
  .print-card-title {
    font-weight: bold;
    font-size: 10px;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 2px;
    margin-bottom: 4px;
  }
  
  .print-card-content {
    font-size: 9px;
  }
  
  .print-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .print-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 6px;
    font-size: 9px;
  }
  
  .print-table th {
    background-color: #f3f4f6;
    font-weight: 600;
    text-align: left;
    padding: 2px 4px;
    border: 1px solid #d1d5db;
  }
  
  .print-table td {
    padding: 2px 4px;
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
  
  .print-financial-summary {
    width: 100%;
    font-size: 9px;
  }
  
  .print-financial-summary td {
    padding: 1px 0;
    border: none;
  }
  
  .print-financial-summary .summary-total {
    border-top: 1px solid #d1d5db;
    font-weight: bold;
    padding-top: 2px;
  }
  
  .text-red { color: #dc2626; }
  .text-blue { color: #2563eb; }
  .text-orange { color: #ea580c; }
  
  .font-medium { font-weight: 500; }
  .font-semibold { font-weight: 600; }
  .font-bold { font-weight: 700; }
  
  .print-notes {
    border: 1px solid #d1d5db;
    background-color: #f9fafb;
    padding: 4px;
    border-radius: 3px;
    font-size: 9px;
  }
  
  .print-footer {
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px solid #d1d5db;
    text-align: center;
    font-size: 9px;
    color: #6b7280;
  }

  @media screen {
    body {
      background-color: #f5f5f5;
      padding: 12px;
    }
    
    .print-container {
      max-width: 190mm;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      margin: 0 auto;
    }
  }
  
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
`

