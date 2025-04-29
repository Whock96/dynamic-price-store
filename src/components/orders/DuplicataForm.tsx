import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { Duplicata, RefTable } from "@/types/duplicata";
import { Order } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useBoletoPdf } from "@/hooks/use-boleto-pdf";

interface Props {
  value?: Partial<Duplicata>;
  lookup: {
    modos: RefTable[];
    portadores: RefTable[];
    bancos: RefTable[];
    statuses: RefTable[];
  };
  onSave: (data: Partial<Duplicata>, file?: File | null) => void;
  onCancel: () => void;
  onDeletePdf?: () => Promise<void>;
  isSaving: boolean;
  isOpen: boolean;
  invoiceNumber?: string | null;
  order?: Order;
  duplicatas?: Duplicata[];
}

const DuplicataForm: React.FC<Props> = ({
  value,
  lookup,
  onSave,
  onCancel,
  isSaving,
  onDeletePdf,
  isOpen,
  invoiceNumber,
  order,
  duplicatas = []
}) => {
  const [data, setData] = useState<Partial<Duplicata>>({});
  const [showPayment, setShowPayment] = useState(false);
  const [numeroComplemento, setNumeroComplemento] = useState("");
  const [valorFinal, setValorFinal] = useState<number>(0);
  
  const { 
    boletoPdfFile, 
    boletoPdfPath, 
    isUploading: isUploadingBoleto, 
    isDeleting: isDeletingBoleto,
    handleFileChange: handleBoletoPdfChange,
    deleteFile: handleDeleteBoletoPdf
  } = useBoletoPdf({ 
    initialPath: value?.pdfBoletoPath || null,
    duplicataId: value?.id,
    onDelete: onDeletePdf
  });

  useEffect(() => {
    console.log("[DUPLICATA FORM] Recebendo valor inicial:", {
      duplicataId: value?.id,
      pdfBoletoPath: value?.pdfBoletoPath,
      valorFinal: value?.valorFinal,
      comissionDuplicata: value?.comissionDuplicata,
      comissionValue: value?.comissionValue
    });
    
    setData({ ...value });
    setValorFinal(value?.valorFinal || 0);
    
    if (value?.numeroDuplicata && invoiceNumber) {
      const prefix = `${invoiceNumber}-`;
      if (value.numeroDuplicata.startsWith(prefix)) {
        setNumeroComplemento(value.numeroDuplicata.slice(prefix.length));
      } else {
        setNumeroComplemento("");
      }
    } else {
      setNumeroComplemento("");
    }
    
    const s =
      value?.paymentStatus?.nome || 
      lookup.statuses.find((t) => t.id === value?.paymentStatusId)?.nome || 
      "";
    setShowPayment(s === "Pago" || s === "Pago Parcialmente");
  }, [value, invoiceNumber, lookup.statuses]);

  // Efeito para buscar a comissão do vendedor quando criar uma nova duplicata
  useEffect(() => {
    const fetchUserCommission = async (userId: string) => {
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('commission')
          .eq('id', userId)
          .single();
          
        if (error) throw error;
        
        if (userData && userData.commission !== null) {
          console.log("[DUPLICATA FORM] Comissão do vendedor carregada:", userData.commission);
          setData(prev => ({ ...prev, comissionDuplicata: userData.commission }));
        }
      } catch (error) {
        console.error("[DUPLICATA FORM] Erro ao buscar comissão do vendedor:", error);
      }
    };
    
    // Se for uma nova duplicata e temos o ID do usuário no pedido
    if (!value?.id && order?.userId) {
      console.log("[DUPLICATA FORM] Buscando comissão do vendedor:", order.userId);
      fetchUserCommission(order.userId);
    }
  }, [value?.id, order?.userId]);

  // Efeito para calcular o valor da comissão
  useEffect(() => {
    if (order?.subtotal && data.comissionDuplicata !== undefined) {
      // Número total de duplicatas (incluindo esta se for nova)
      const totalDuplicatas = duplicatas.length + (value?.id ? 0 : 1);
      
      if (totalDuplicatas > 0) {
        const comissionValue = (data.comissionDuplicata / 100) * order.subtotal / totalDuplicatas;
        
        console.log("[DUPLICATA FORM] Calculando valor da comissão:", {
          comissionPercentage: data.comissionDuplicata,
          subtotal: order.subtotal,
          totalDuplicatas,
          comissionValue
        });
        
        setData(prev => ({ ...prev, comissionValue: Number(comissionValue.toFixed(2)) }));
      }
    }
  }, [data.comissionDuplicata, order?.subtotal, duplicatas.length, value?.id]);

  useEffect(() => {
    const s =
      lookup.statuses.find((t) => t.id === data.paymentStatusId)?.nome ?? "";
    setShowPayment(s === "Pago" || s === "Pago Parcialmente");
  }, [data.paymentStatusId, lookup.statuses]);

  // Calculate valor final whenever valor, acréscimo or desconto changes
  useEffect(() => {
    const valor = Number(data.valor || 0);
    const acrescimo = Number(data.valorAcrescimo || 0);
    const desconto = Number(data.valorDesconto || 0);
    
    const calculatedValorFinal = valor + acrescimo - desconto;
    setValorFinal(calculatedValorFinal);
    setData(prev => ({...prev, valorFinal: calculatedValorFinal}));
  }, [data.valor, data.valorAcrescimo, data.valorDesconto]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!data.dataEmissao || !data.dataVencimento || !data.valor ||
      !data.modoPagamentoId || !data.portadorId || !data.bancoId ||
      !data.paymentStatusId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    let numeroDuplicataFinal = "";
    if (invoiceNumber && numeroComplemento.trim()) {
      numeroDuplicataFinal = `${invoiceNumber}-${numeroComplemento.trim()}`;
    } else if (invoiceNumber) {
      numeroDuplicataFinal = invoiceNumber;
    } else {
      numeroDuplicataFinal = numeroComplemento.trim();
    }
    
    // Garantir que os campos de comissão estejam incluídos nos dados
    const formData = {
      ...data,
      numeroDuplicata: numeroDuplicataFinal,
      valorFinal: valorFinal,
      comissionDuplicata: data.comissionDuplicata || 0,
      comissionValue: data.comissionValue || 0
    };
    
    console.log("[DUPLICATA FORM] Enviando formulário para salvar duplicata:", {
      numeroDuplicata: formData.numeroDuplicata,
      valor: formData.valor,
      valorAcrescimo: formData.valorAcrescimo,
      valorDesconto: formData.valorDesconto,
      valorFinal: formData.valorFinal,
      pdfBoletoPath: formData.pdfBoletoPath,
      comissionDuplicata: formData.comissionDuplicata,
      comissionValue: formData.comissionValue,
      temArquivoParaUpload: !!boletoPdfFile,
      arquivoNome: boletoPdfFile?.name
    });
    
    onSave(formData, boletoPdfFile);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{value?.id ? "Editar Duplicata" : "Nova Duplicata"}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2 flex gap-2">
                <div className="w-1/2">
                  <Label>Número da NFe</Label>
                  <Input
                    value={invoiceNumber || ""}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                <div className="w-1/2">
                  <Label>Complemento</Label>
                  <Input
                    required
                    maxLength={12}
                    placeholder="A / B / N1"
                    value={numeroComplemento}
                    onChange={(e) => setNumeroComplemento(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
              <div />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Data Emissão</Label>
                <Input
                  type="date"
                  required
                  value={data.dataEmissao || ""}
                  onChange={(e) =>
                    setData((v) => ({ ...v, dataEmissao: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Data Vencimento</Label>
                <Input
                  type="date"
                  required
                  value={data.dataVencimento || ""}
                  onChange={(e) =>
                    setData((v) => ({ ...v, dataVencimento: e.target.value }))
                  }
                />
              </div>
              <div />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={data.valor || ""}
                  onChange={(e) =>
                    setData((v) => ({
                      ...v,
                      valor: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Valor Acréscimo (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={data.valorAcrescimo || ""}
                  onChange={(e) =>
                    setData((v) => ({
                      ...v,
                      valorAcrescimo: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Valor Desconto (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={data.valorDesconto || ""}
                  onChange={(e) =>
                    setData((v) => ({
                      ...v,
                      valorDesconto: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Valor Final (R$)</Label>
                <Input
                  type="number"
                  readOnly
                  className="bg-gray-100 text-ferplas-600 font-medium"
                  value={valorFinal}
                />
              </div>
            </div>

            {/* Seção de comissão */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Comissão (%)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={data.comissionDuplicata || ""}
                  onChange={(e) =>
                    setData((v) => ({
                      ...v,
                      comissionDuplicata: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Valor da Comissão (R$)</Label>
                <Input
                  type="number"
                  readOnly
                  className="bg-gray-100 text-ferplas-600 font-medium"
                  value={data.comissionValue || 0}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Modo Pagamento</Label>
                <Select
                  value={data.modoPagamentoId || ""}
                  onValueChange={(val) =>
                    setData((v) => ({ ...v, modoPagamentoId: val }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lookup.modos.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Portador</Label>
                <Select
                  value={data.portadorId || ""}
                  onValueChange={(val) =>
                    setData((v) => ({ ...v, portadorId: val }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lookup.portadores.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Banco</Label>
                <Select
                  value={data.bancoId || ""}
                  onValueChange={(val) =>
                    setData((v) => ({ ...v, bancoId: val }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lookup.bancos.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Situação</Label>
                <Select
                  value={data.paymentStatusId || ""}
                  onValueChange={(val) =>
                    setData((v) => ({ ...v, paymentStatusId: val }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lookup.statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {showPayment && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Valor Recebido (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={data.valorRecebido || ""}
                    onChange={(e) =>
                      setData((v) => ({
                        ...v,
                        valorRecebido: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Data Pagamento</Label>
                  <Input
                    type="date"
                    value={data.dataPagamento || ""}
                    onChange={(e) =>
                      setData((v) => ({
                        ...v,
                        dataPagamento: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Banco do Pagamento</Label>
                  <Select
                    value={data.bancoPagamentoId || ""}
                    onValueChange={(val) =>
                      setData((v) => ({
                        ...v,
                        bancoPagamentoId: val,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {lookup.bancos.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div>
              <Label>Boleto PDF</Label>
              <FileUpload
                onChange={handleBoletoPdfChange}
                value={boletoPdfPath || ""}
                accept="application/pdf,.pdf"
                maxSize={15}
                isLoading={isSaving || isUploadingBoleto || isDeletingBoleto}
                onDelete={boletoPdfPath ? handleDeleteBoletoPdf : undefined}
              />
              <span className="text-xs text-muted-foreground">
                Formato: PDF, até 15MB.
              </span>
            </div>
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="outline" type="button" disabled={isSaving || isUploadingBoleto || isDeletingBoleto}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSaving || isUploadingBoleto || isDeletingBoleto}
                className="bg-ferplas-500 hover:bg-ferplas-600"
              >
                {(isSaving || isUploadingBoleto) ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicataForm;
