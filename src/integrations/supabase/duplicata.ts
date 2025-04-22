
import { supabase } from "@/integrations/supabase/client";
import { Duplicata, RefTable } from "@/types/duplicata";

// LOOKUP TABLE FETCHERS
export async function fetchRefTable(table: string): Promise<RefTable[]> {
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
  // Renomear os campos aninhados para os nomes certos para o formulário/tabela
  return (data || []).map(d => ({
    ...d,
    modoPagamento: d.modo_pagamento,
    portador: d.portador,
    banco: d.banco,
    bancoPagamento: d.banco_pagamento,
    paymentStatus: d.payment_status,
  }));
}

export async function upsertDuplicata(duplicata: Partial<Duplicata>) {
  // upsert = insert or update by id
  const { data, error } = await supabase
    .from('duplicatas')
    .upsert(duplicata, { onConflict: 'id' })
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
  const { data, error } = await supabase.storage
    .from('boleto_pdfs')
    .upload(fileName, file, { upsert: true, contentType: "application/pdf" });
  if (error) throw error;
  // get public url
  const { data: urlData } = supabase.storage
    .from('boleto_pdfs')
    .getPublicUrl(fileName);
  return urlData.publicUrl ?? null;
}

export async function deleteBoletoPdf(path: string): Promise<boolean> {
  // path could be full url or bucket path; we'll normalize
  const fileName = path.split('/').pop();
  if (!fileName) return false;
  const { error } = await supabase.storage.from('boleto_pdfs').remove([fileName]);
  if (error) throw error;
  return true;
}
