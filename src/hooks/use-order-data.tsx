
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/types';
import { toast } from 'sonner';
import { useOrders } from "@/context/OrderContext";

interface UseOrderDataProps {
  customerId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export const useOrderData = ({ customerId, userId, startDate, endDate }: UseOrderDataProps = {}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setOrder } = useOrders();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('orders')
        .select(`
          *,
          customer:customer_id (
            company_name
          ),
          user:user_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate);
      } else if (startDate) {
        query = query.gte('created_at', startDate);
      } else if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
        toast.error(`Erro ao buscar pedidos: ${error.message}`);
      } else if (data) {
        // Convert Supabase orders to app Order type using the adapter
        const processedOrders = data.map(order => {
          return {
            id: order.id,
            orderNumber: order.order_number,
            customerId: order.customer_id,
            customer: {
              id: order.customer_id,
              companyName: order.customer?.company_name || 'Cliente não encontrado',
              document: '',
              salesPersonId: '',
              street: '',
              number: '',
              noNumber: false,
              complement: '',
              neighborhood: '',
              city: '',
              state: '',
              zipCode: '',
              phone: '',
              email: '',
              defaultDiscount: 0,
              maxDiscount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              registerDate: new Date(),
            },
            userId: order.user_id,
            user: {
              id: order.user_id || '',
              username: '',
              name: order.user?.name || 'Usuário do Sistema',
              email: '',
              createdAt: new Date(),
              userTypeId: '',
            },
            items: [],
            appliedDiscounts: [],
            totalDiscount: Number(order.total_discount || 0),
            subtotal: Number(order.subtotal || 0),
            total: Number(order.total || 0),
            status: order.status as Order['status'],
            shipping: order.shipping as Order['shipping'],
            fullInvoice: order.full_invoice,
            taxSubstitution: order.tax_substitution,
            paymentMethod: order.payment_method as Order['paymentMethod'],
            paymentTerms: order.payment_terms || '',
            notes: order.notes || '',
            observations: order.observations || '',
            createdAt: new Date(order.created_at),
            updatedAt: new Date(order.updated_at),
            deliveryLocation: order.delivery_location as Order['deliveryLocation'],
            halfInvoiceType: order.half_invoice_type === 'price' ? 'price' : 'quantity',
            halfInvoicePercentage: Number(order.half_invoice_percentage || 50),
            deliveryFee: Number(order.delivery_fee || 0),
            withIPI: order.with_ipi || false,
            ipiValue: Number(order.ipi_value || 0),
            transportCompanyId: order.transport_company_id,
            transportCompanyName: order.transport_company_name,
            invoiceNumber: order.invoice_number || null,
            invoicePdfPath: order.invoice_pdf_path || null,
            productsTotal: Number(order.products_total || 0),
            taxSubstitutionTotal: Number(order.tax_substitution_total || 0),
            withSuframa: order.with_suframa || false
          } as Order;
        });
        setOrders(processedOrders);
      } else {
        setOrders([]);
      }

      setLoading(false);
    };

    fetchOrders();
  }, [customerId, userId, startDate, endDate, setOrder]);

  return { orders, loading, error };
};
