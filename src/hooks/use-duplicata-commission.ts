
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

  // Modificamos esta função para aceitar parâmetros opcionais para dados atualizados
  const recalculateAllCommissions = useCallback(async (
    currentOrder?: Order,
    currentDuplicatas?: Duplicata[]
  ) => {
    // Use os parâmetros passados ou, caso contrário, use os valores do estado do hook
    const orderToUse = currentOrder || order;
    const duplicatasToUse = currentDuplicatas || duplicatas;
    
    if (!orderToUse?.id || !orderToUse.subtotal || duplicatasToUse.length === 0) {
      console.log("[COMISSÃO] Não foi possível recalcular comissões: dados insuficientes", {
        orderId: orderToUse?.id,
        subtotal: orderToUse?.subtotal,
        duplicatasCount: duplicatasToUse.length
      });
      return;
    }
    
    setIsRecalculating(true);
    
    try {
      console.log("[COMISSÃO] Recalculando comissões para todas duplicatas", {
        orderId: orderToUse.id,
        subtotal: orderToUse.subtotal,
        duplicatasCount: duplicatasToUse.length
      });
      
      // Para cada duplicata, recalcular o valor da comissão
      for (const duplicata of duplicatasToUse) {
        if (duplicata.comissionDuplicata !== undefined && duplicata.id) {
          const comissionValue = (duplicata.comissionDuplicata / 100) * orderToUse.subtotal / duplicatasToUse.length;
          const roundedComissionValue = Number(comissionValue.toFixed(2));
          
          // MODIFICAÇÃO: Removemos a verificação que impedia a atualização quando os valores eram iguais
          // e sempre atualizamos o valor da comissão para garantir que alterações recentes sejam aplicadas
          console.log("[COMISSÃO] Recalculando comissão para duplicata", {
            duplicataId: duplicata.id,
            comissionPercentage: duplicata.comissionDuplicata,
            oldComissionValue: duplicata.comissionValue,
            newComissionValue: roundedComissionValue,
            subtotal: orderToUse.subtotal,
            totalDuplicatas: duplicatasToUse.length,
            formula: `(${duplicata.comissionDuplicata}% / 100) * ${orderToUse.subtotal} / ${duplicatasToUse.length} = ${roundedComissionValue}`
          });
          
          // Atualizar a duplicata
          const updatedDuplicata = {
            ...duplicata,
            comissionValue: roundedComissionValue
          };
          
          await upsertDuplicata(updatedDuplicata);
          console.log("[COMISSÃO] Valor da comissão atualizado para duplicata", {
            duplicataId: duplicata.id,
            novoValorComissao: roundedComissionValue
          });
        }
      }
      
      console.log("[COMISSÃO] Recálculo de comissões concluído com sucesso");
      return true;
    } catch (error) {
      console.error("[COMISSÃO] Erro ao recalcular comissões:", error);
      toast.error("Erro ao recalcular as comissões das duplicatas");
      return false;
    } finally {
      setIsRecalculating(false);
    }
  }, [order, duplicatas]);

  return {
    isRecalculating,
    recalculateAllCommissions,
  };
};
