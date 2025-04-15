
const halfInvoiceType = order.halfInvoiceType || 'quantity';
const ipiValue = order.withIPI ? (order.ipiValue || 0) : 0;

// Update the calculations to use the correct halfInvoiceType
const calculatePriceWithInvoice = (finalPrice: number, percentage: number) => {
  return finalPrice * (percentage / 100);
};

const calculatePriceWithoutInvoice = (finalPrice: number, percentage: number) => {
  return finalPrice * ((100 - percentage) / 100);
};

const calculateQuantityWithInvoice = (totalUnits: number, percentage: number) => {
  return Math.round(totalUnits * (percentage / 100));
};

const calculateQuantityWithoutInvoice = (totalUnits: number, percentage: number) => {
  return Math.round(totalUnits * ((100 - percentage) / 100));
};

// In the rendering logic, use halfInvoiceType for conditionals
{!order.fullInvoice && halfInvoiceType === 'price' && (
  <>
    <th className="border p-1 text-right">Preço c/ nota</th>
    <th className="border p-1 text-right">Preço s/ nota</th>
  </>
)}

{!order.fullInvoice && halfInvoiceType === 'quantity' && (
  <>
    <th className="border p-1 text-center">Qtd. c/ nota</th>
    <th className="border p-1 text-center">Qtd. s/ nota</th>
  </>
)}
