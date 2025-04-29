
import { useState, useCallback } from 'react';
import { Duplicata } from '@/types/duplicata';
import { Order } from '@/types/types';
import { upsertDuplicata } from '@/integrations/supabase/duplicata';
import { toast } from 'sonner';

export interface UseDuplicataCommissionProps {
  order?: Order;
  duplicatas: Duplicata[];
}

export const useDuplicataCommission = ({ order, duplicatas }: UseDuplicataCommissionProps) => {
  const [isRecalculating, setIsRecalculating] = useState(false);

  const recalculateAllCommissions = useCallback(async () => {
    if (!order?.id || !order.productsTotal || duplicatas.length === 0) {
      return;
    }
    
    setIsRecalculating(true);
    
    try {
      console.log("[COMISSÃO] Recalculando comissões para todas duplicatas", {
        orderId: order.id,
        productsTotal: order.productsTotal,
        duplicatasCount: duplicatas.length
      });
      
      // Para cada duplicata, recalcular o valor da comissão
      for (const duplicata of duplicatas) {
        if (duplicata.comissionDuplicata !== undefined && duplicata.id) {
          const comissionValue = (duplicata.comissionDuplicata / 100) * order.productsTotal / duplicatas.length;
          
          console.log("[COMISSÃO] Recalculando comissão para duplicata", {
            duplicataId: duplicata.id,
            comissionPercentage: duplicata.comissionDuplicata,
            comissionValue: comissionValue,
            productsTotal: order.productsTotal,
            totalDuplicatas: duplicatas.length
          });
          
          // Atualizar a duplicata
          const updatedDuplicata = {
            ...duplicata,
            comissionValue: Number(comissionValue.toFixed(2))
          };
          
          await upsertDuplicata(updatedDuplicata);
        }
      }
      
      console.log("[COMISSÃO] Recálculo de comissões concluído com sucesso");
    } catch (error) {
      console.error("[COMISSÃO] Erro ao recalcular comissões:", error);
      toast.error("Erro ao recalcular as comissões das duplicatas");
    } finally {
      setIsRecalculating(false);
    }
  }, [order, duplicatas]);

  return {
    isRecalculating,
    recalculateAllCommissions,
  };
};
