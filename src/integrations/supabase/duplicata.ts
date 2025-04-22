
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
    pdf_boleto_path: duplicata.pdfBoletoPath
  };

  const { data, error } = await supabase
    .from('duplicatas')
    .upsert(dbDuplicata, { onConflict: 'id' })
    .select();
  if (error) throw error;
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

// FILE UPLOAD/DELETE
export async function uploadBoletoPdf(file: File, duplicataId: string): Promise<string | null> {
  const fileName = `boleto_${duplicataId}_${Date.now()}.pdf`;
  
  // Log the file information for debugging
  console.log(`Uploading PDF for duplicata: ${duplicataId}`, {
    fileName,
    fileSize: file.size,
    fileType: file.type
  });
  
  const { data, error } = await supabase.storage
    .from('boleto_pdfs')
    .upload(fileName, file, { upsert: true, contentType: "application/pdf" });
  
  if (error) {
    console.error("Error uploading PDF:", error);
    throw error;
  }
  
  console.log("Upload successful, getting public URL", data);
  
  // get public url
  const { data: urlData } = supabase.storage
    .from('boleto_pdfs')
    .getPublicUrl(fileName);
  
  console.log("Public URL:", urlData.publicUrl);
  
  return urlData.publicUrl ?? null;
}

export async function deleteBoletoPdf(path: string): Promise<boolean> {
  // path could be full url or bucket path; we'll normalize
  const fileName = path.split('/').pop();
  if (!fileName) return false;
  
  console.log(`Deleting file: ${fileName}`);
  
  const { error } = await supabase.storage.from('boleto_pdfs').remove([fileName]);
  if (error) {
    console.error("Error deleting PDF:", error);
    throw error;
  }
  return true;
}
