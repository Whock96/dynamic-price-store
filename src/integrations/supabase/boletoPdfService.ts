
import { supabase } from "@/integrations/supabase/client";

/**
 * Serviço exclusivo para gerenciamento de PDFs de boletos das duplicatas
 */
export async function uploadBoletoPdf(file: File, duplicataId: string): Promise<string> {
  if (!file) {
    console.error("[BOLETO_SERVICE] Nenhum arquivo fornecido para upload");
    throw new Error("Nenhum arquivo fornecido para upload");
  }

  // Nome de arquivo único para o boleto
  const fileName = `boleto_${duplicataId}_${Date.now()}.pdf`;
  
  console.log(`[BOLETO_SERVICE] Iniciando upload do PDF de boleto`, {
    duplicataId,
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
      console.error("[BOLETO_SERVICE] Erro ao fazer upload do PDF de boleto:", error);
      throw error;
    }
    
    console.log("[BOLETO_SERVICE] Upload bem-sucedido, obtendo URL pública", data);
    
    // Obtém a URL pública do bucket de boletos
    const { data: urlData } = supabase.storage
      .from('boleto_pdfs')
      .getPublicUrl(fileName);
    
    if (!urlData || !urlData.publicUrl) {
      console.error("[BOLETO_SERVICE] Falha ao obter URL pública para o arquivo de boleto");
      throw new Error("Falha ao obter URL pública para o arquivo de boleto");
    }
    
    console.log("[BOLETO_SERVICE] URL pública do PDF do boleto gerada:", urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("[BOLETO_SERVICE] Exceção durante o upload do PDF de boleto:", error);
    throw error;
  }
}

export async function deleteBoletoPdf(path: string): Promise<boolean> {
  // Normalização do caminho, que pode ser uma URL completa ou apenas o caminho do bucket
  const fileName = path.split('/').pop();
  if (!fileName) {
    console.error("[BOLETO_SERVICE] Caminho de arquivo inválido para exclusão:", path);
    return false;
  }
  
  console.log(`[BOLETO_SERVICE] Excluindo arquivo de boleto: ${fileName}`);
  
  const { error } = await supabase.storage.from('boleto_pdfs').remove([fileName]);
  if (error) {
    console.error("[BOLETO_SERVICE] Erro ao excluir PDF do boleto:", error);
    throw error;
  }
  return true;
}
