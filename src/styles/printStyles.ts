
export const printStyles = `
  @media print {
    @page { 
      size: A4; 
      margin: 10mm; 
    }
    
    body { 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12px;
    }
    
    /* Container */
    .print-container {
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 16px !important;
      background-color: white !important;
    }
    
    /* Layout */
    .flex { display: flex !important; }
    .items-start { align-items: flex-start !important; }
    .items-center { align-items: center !important; }
    .justify-between { justify-content: space-between !important; }
    
    /* Grid */
    .grid { display: grid !important; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .gap-2 { gap: 0.5rem !important; }
    
    /* Text alignment */
    .text-left { text-align: left !important; }
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    
    /* Font sizes */
    .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
    .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
    .text-base { font-size: 1rem !important; line-height: 1.5rem !important; }
    .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
    .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
    
    /* Font weights */
    .font-medium { font-weight: 500 !important; }
    .font-semibold { font-weight: 600 !important; }
    .font-bold { font-weight: 700 !important; }
    
    /* Spacing */
    .p-1 { padding: 0.25rem !important; }
    .p-2 { padding: 0.5rem !important; }
    .p-4 { padding: 1rem !important; }
    .px-3 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
    .py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
    .py-0\\.5 { padding-top: 0.125rem !important; padding-bottom: 0.125rem !important; }
    .pb-0\\.5 { padding-bottom: 0.125rem !important; }
    .pb-2 { padding-bottom: 0.5rem !important; }
    .pt-2 { padding-top: 0.5rem !important; }
    .mb-1 { margin-bottom: 0.25rem !important; }
    .mb-2 { margin-bottom: 0.5rem !important; }
    .mb-3 { margin-bottom: 0.75rem !important; }
    .mt-0\\.5 { margin-top: 0.125rem !important; }
    .mt-2 { margin-top: 0.5rem !important; }
    .mx-auto { margin-left: auto !important; margin-right: auto !important; }
    
    /* Borders and colors */
    .border { border-width: 1px !important; border-style: solid !important; border-color: #d1d5db !important; }
    .border-t { border-top-width: 1px !important; border-top-style: solid !important; border-top-color: #d1d5db !important; }
    .border-b { border-bottom-width: 1px !important; border-bottom-style: solid !important; border-bottom-color: #d1d5db !important; }
    .border-gray-200 { border-color: #e5e7eb !important; }
    .border-gray-300 { border-color: #d1d5db !important; }
    .rounded { border-radius: 0.25rem !important; }
    
    /* Backgrounds */
    .bg-white { background-color: white !important; }
    .bg-gray-50 { background-color: #f9fafb !important; }
    .bg-gray-100 { background-color: #f3f4f6 !important; }
    
    /* Text colors */
    .text-gray-500 { color: #6b7280 !important; }
    .text-red-600 { color: #dc2626 !important; }
    .text-blue-600 { color: #2563eb !important; }
    .text-orange-600 { color: #ea580c !important; }
    
    /* Tables */
    .w-full { width: 100% !important; }
    .border-collapse { border-collapse: collapse !important; }
    
    table { page-break-inside: auto !important; }
    tr { page-break-inside: avoid !important; page-break-after: auto !important; }
    th, td { border: 1px solid #d1d5db !important; }
    th { background-color: #f3f4f6 !important; font-weight: 600 !important; }
    
    /* Images */
    img { max-width: 100% !important; }
    
    /* Fix broken images */
    a[href]::after {
      content: none !important;
    }
  }
`;
