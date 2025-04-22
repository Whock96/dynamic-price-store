
import { supabase } from "@/integrations/supabase/client";
import { Duplicata, RefTable } from "@/types/duplicata";

// LOOKUP TABLE FETCHERS
export async function fetchRefTable(table: "modo_pagamento" | "portador" | "bancos" | "payment_status"): Promise<RefTable[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return data as RefTable[];
}

// DUPLICATAS
export async function fetchDuplicatas(orderId: string): Promise<Duplicata[]> {
  const { data, error } = await supabase
    .from("duplicatas")
    .select(
      `*,
      modo_pagamento:modo_pagamento_id(id,nome),
      portador:portador_id(id,nome),
      banco:banco_id(id,nome),
      banco_pagamento:banco_pagamento_id(id,nome),
      payment_status:payment_status_id(id,nome)
    `
    )
    .eq("order_id", orderId)
    .order("data_vencimento", { ascending: true });
  if (error) throw error;

  function isRefTable(obj: any): obj is RefTable {
    return obj && typeof obj === 'object' && 'id' in obj && 'nome' in obj;
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    orderId: d.order_id,
    numeroDuplicata: d.numero_duplicata,
    dataEmissao: d.data_emissao,
    dataVencimento: d.data_vencimento,
    valor: d.valor,
    valorAcrescimo: d.valor_acrescimo,
    valorDesconto: d.valor_desconto,
    modoPagamentoId: d.modo_pagamento_id,
    portadorId: d.portador_id,
    bancoId: d.banco_id,
    paymentStatusId: d.payment_status_id,
    valorRecebido: d.valor_recebido,
    dataPagamento: d.data_pagamento,
    bancoPagamentoId: d.banco_pagamento_id,
    pdfBoletoPath: d.pdf_boleto_path,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    modoPagamento: isRefTable(d.modo_pagamento) ? d.modo_pagamento : undefined,
    portador: isRefTable(d.portador) ? d.portador : undefined,
    banco: isRefTable(d.banco) ? d.banco : undefined,
    bancoPagamento: isRefTable(d.banco_pagamento) ? d.banco_pagamento : undefined,
    paymentStatus: isRefTable(d.payment_status) ? d.payment_status : undefined,
  }));
}

export async function upsertDuplicata(duplicata: Partial<Duplicata>) {
  // Mapeamento explícito para o formato do banco de dados
  const dbDuplicata = {
    id: duplicata.id,
    order_id: duplicata.orderId,
    numero_duplicata: duplicata.numeroDuplicata,
    data_emissao: duplicata.dataEmissao,
    data_vencimento: duplicata.dataVencimento,
    valor: duplicata.valor,
    valor_acrescimo: duplicata.valorAcrescimo,
    valor_desconto: duplicata.valorDesconto,
    modo_pagamento_id: duplicata.modoPagamentoId,
    portador_id: duplicata.portadorId,
    banco_id: duplicata.bancoId,
    payment_status_id: duplicata.paymentStatusId,
    valor_recebido: duplicata.valorRecebido,
    data_pagamento: duplicata.dataPagamento,
    banco_pagamento_id: duplicata.bancoPagamentoId,
    pdf_boleto_path: duplicata.pdfBoletoPath,
  };

  // Log detalhado para depuração
  console.log("[SUPABASE DUPLICATA] upsertDuplicata - Salvando duplicata:", {
    id: dbDuplicata.id,
    numero_duplicata: dbDuplicata.numero_duplicata,
    pdf_boleto_path: dbDuplicata.pdf_boleto_path  // Verificamos que o caminho do PDF está sendo enviado corretamente
  });

  const { data, error } = await supabase
    .from("duplicatas")
    .upsert(dbDuplicata, { onConflict: "id" })
    .select();

  if (error) {
    console.error("[SUPABASE DUPLICATA] upsertDuplicata - Erro ao salvar duplicata:", error);
    throw error;
  }

  console.log("[SUPABASE DUPLICATA] upsertDuplicata - Dados salvos com sucesso:", data && data[0]);
  return data && data[0];
}

export async function deleteDuplicata(id: string) {
  const { error } = await supabase
    .from('duplicatas')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

// FILE UPLOAD/DELETE para BOLETO
export async function uploadBoletoPdf(file: File, duplicataId: string): Promise<string> {
  if (!file) {
    console.error("[SUPABASE BOLETO] Nenhum arquivo fornecido para upload");
    throw new Error("Nenhum arquivo fornecido para upload");
  }

  // Nome de arquivo único para o boleto
  const fileName = `boleto_${duplicataId}_${Date.now()}.pdf`;
  
  // Log do arquivo para depuração
  console.log(`[SUPABASE BOLETO] Iniciando upload do PDF de boleto para duplicata: ${duplicataId}`, {
    fileName,
    fileSize: file.size,
    fileType: file.type
  });
  
  try {
    // Upload para o bucket específico de boletos
    const { data, error } = await supabase.storage
      .from('boleto_pdfs')
      .upload(fileName, file, { upsert: true, contentType: "application/pdf" });
    
    if (error) {
      console.error("[SUPABASE BOLETO] Erro ao fazer upload do PDF de boleto:", error);
      throw error;
    }
    
    console.log("[SUPABASE BOLETO] Upload bem-sucedido, obtendo URL pública", data);
    
    // Obtém a URL pública do bucket de boletos
    const { data: urlData } = supabase.storage
      .from('boleto_pdfs')
      .getPublicUrl(fileName);
    
    if (!urlData || !urlData.publicUrl) {
      console.error("[SUPABASE BOLETO] Falha ao obter URL pública para o arquivo de boleto");
      throw new Error("Falha ao obter URL pública para o arquivo de boleto");
    }
    
    console.log("[SUPABASE BOLETO] URL pública do PDF do boleto gerada:", urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("[SUPABASE BOLETO] Exceção durante o upload do PDF de boleto:", error);
    throw error;
  }
}

export async function deleteBoletoPdf(path: string): Promise<boolean> {
  // Normalização do caminho, que pode ser uma URL completa ou apenas o caminho do bucket
  const fileName = path.split('/').pop();
  if (!fileName) {
    console.error("[SUPABASE BOLETO] Caminho de arquivo inválido para exclusão:", path);
    return false;
  }
  
  console.log(`[SUPABASE BOLETO] Excluindo arquivo de boleto: ${fileName}`);
  
  const { error } = await supabase.storage.from('boleto_pdfs').remove([fileName]);
  if (error) {
    console.error("[SUPABASE BOLETO] Erro ao excluir PDF do boleto:", error);
    throw error;
  }
  return true;
}
