import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/types';
import { toast } from 'sonner';
import { useOrder } from "@/context/OrderContext";

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
  const { setOrder } = useOrder();

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
      } else {
        setOrders(data || []);
      }

      setLoading(false);
    };

    fetchOrders();
  }, [customerId, userId, startDate, endDate, setOrder]);

  return { orders, loading, error };
};
