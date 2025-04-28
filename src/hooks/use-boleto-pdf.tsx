
import { useState } from "react";
import { uploadBoletoPdf, deleteBoletoPdf } from "@/integrations/supabase/boletoPdfService";
import { toast } from "sonner";

interface UseBoletoPdfProps {
  initialPath?: string | null;
  duplicataId?: string;
  onSuccess?: (url: string) => void;
  onDelete?: () => void;
}

export function useBoletoPdf({ 
  initialPath = null, 
  duplicataId = "", 
  onSuccess, 
  onDelete 
}: UseBoletoPdfProps = {}) {
  const [boletoPdfFile, setBoletoPdfFile] = useState<File | null>(null);
  const [boletoPdfPath, setBoletoPdfPath] = useState<string | null>(initialPath);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileChange = (file: File | null) => {
    console.log("[BOLETO_HOOK] Arquivo de boleto selecionado:", 
      file ? `${file.name} (${Math.round(file.size/1024)}KB)` : "nenhum");
    setBoletoPdfFile(file);
  };

  const uploadFile = async () => {
    if (!boletoPdfFile) {
      console.log("[BOLETO_HOOK] Nenhum arquivo selecionado para upload");
      return null;
    }
    
    if (!duplicataId) {
      console.error("[BOLETO_HOOK] ID da duplicata não informado");
      toast.error("Erro: ID da duplicata não informado");
      return null;
    }

    setIsUploading(true);
    try {
      console.log("[BOLETO_HOOK] Iniciando upload do boleto:", boletoPdfFile.name);
      const uploadId = duplicataId || `temp-${Date.now()}`;
      const url = await uploadBoletoPdf(boletoPdfFile, uploadId);
      
      console.log("[BOLETO_HOOK] Upload concluído com sucesso:", url);
      setBoletoPdfPath(url);
      setBoletoPdfFile(null);
      
      if (onSuccess) {
        onSuccess(url);
      }
      
      return url;
    } catch (error) {
      console.error("[BOLETO_HOOK] Erro ao fazer upload do boleto:", error);
      toast.error("Erro ao fazer upload do boleto. Tente novamente.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async () => {
    if (!boletoPdfPath) {
      console.log("[BOLETO_HOOK] Nenhum arquivo para excluir");
      return;
    }

    setIsDeleting(true);
    try {
      console.log("[BOLETO_HOOK] Excluindo boleto:", boletoPdfPath);
      await deleteBoletoPdf(boletoPdfPath);
      
      setBoletoPdfPath(null);
      console.log("[BOLETO_HOOK] Boleto excluído com sucesso");
      toast.success("Boleto excluído com sucesso");
      
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("[BOLETO_HOOK] Erro ao excluir boleto:", error);
      toast.error("Erro ao excluir o boleto. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    boletoPdfFile,
    boletoPdfPath,
    isUploading,
    isDeleting,
    handleFileChange,
    uploadFile,
    deleteFile,
    setBoletoPdfPath
  };
}
