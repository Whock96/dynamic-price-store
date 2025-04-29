
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
      console.log("[COMISSÃO] Não foi possível recalcular comissões: dados insuficientes", {
        orderId: order?.id,
        productsTotal: order?.productsTotal,
        duplicatasCount: duplicatas.length
      });
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
          const roundedComissionValue = Number(comissionValue.toFixed(2));
          
          // Verificar se o valor calculado é diferente do valor atual para evitar updates desnecessários
          if (duplicata.comissionValue !== roundedComissionValue) {
            console.log("[COMISSÃO] Recalculando comissão para duplicata", {
              duplicataId: duplicata.id,
              comissionPercentage: duplicata.comissionDuplicata,
              oldComissionValue: duplicata.comissionValue,
              newComissionValue: roundedComissionValue,
              productsTotal: order.productsTotal,
              totalDuplicatas: duplicatas.length
            });
            
            // Atualizar a duplicata
            const updatedDuplicata = {
              ...duplicata,
              comissionValue: roundedComissionValue
            };
            
            await upsertDuplicata(updatedDuplicata);
          } else {
            console.log("[COMISSÃO] Valor da comissão já está correto para duplicata", {
              duplicataId: duplicata.id,
              comissionValue: duplicata.comissionValue
            });
          }
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
