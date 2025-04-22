
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { Duplicata, RefTable } from "@/types/duplicata";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

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
  invoiceNumber?: string; // [NOVO] - pode ser passado do pedido para cá
}

const DuplicataForm: React.FC<Props> = ({
  value,
  lookup,
  onSave,
  onCancel,
  isSaving,
  onDeletePdf,
  isOpen,
  invoiceNumber
}) => {
  // Extrair o número da nota do prop ou do valor
  const notaNumber =
    invoiceNumber ||
    value?.numeroDuplicata?.split("-")[0] ||
    value?.invoice_number || 
    "";

  // Descobrir o complemento inicial caso esteja editando
  const initialComplement = value?.numeroDuplicata
    ? value.numeroDuplicata.split("-").slice(1).join("-")
    : "";

  const [data, setData] = useState<Partial<Duplicata>>({ ...value });
  const [boletoFile, setBoletoFile] = useState<File | null>(null);
  const [complemento, setComplemento] = useState(initialComplement);
  const [showPayment, setShowPayment] = useState(
    value &&
      (value.paymentStatus?.nome === "Pago" ||
        value.paymentStatus?.nome === "Pago Parcialmente" ||
        value.paymentStatusId === lookup.statuses.find((t) => t.nome === "Pago")?.id ||
        value.paymentStatusId === lookup.statuses.find((t) => t.nome === "Pago Parcialmente")?.id)
  );

  useEffect(() => {
    setData({ ...value });
    setComplemento(
      value?.numeroDuplicata
        ? value.numeroDuplicata.split("-").slice(1).join("-")
        : ""
    );
  }, [value]);

  useEffect(() => {
    const s =
      lookup.statuses.find((t) => t.id === data.paymentStatusId)?.nome ?? "";
    if (s === "Pago" || s === "Pago Parcialmente") setShowPayment(true);
    else setShowPayment(false);
  }, [data.paymentStatusId, lookup.statuses]);

  const handleDeletePdf = async () => {
    if (onDeletePdf) {
      await onDeletePdf();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ao salvar, gera o numeroDuplicata corretamente
    const numeroDuplicataFinal =
      notaNumber && complemento ? `${notaNumber}-${complemento}` : "";
    const cleanData = {
      ...data,
      numeroDuplicata: numeroDuplicataFinal
    };
    onSave(cleanData, boletoFile);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent
        className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto z-[130]" // aumenta z-index para ficar acima do header
        style={{ zIndex: 130 }}
      >
        <DialogHeader>
          <DialogTitle>
            {value?.id ? "Editar Duplicata" : "Nova Duplicata"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="col-span-2 flex gap-3">
                <div>
                  <Label>Número da Nota Fiscal</Label>
                  <Input
                    value={notaNumber}
                    disabled
                    className="bg-gray-100"
                    tabIndex={-1}
                  />
                </div>
                <div>
                  <Label>Complemento</Label>
                  <Input
                    value={complemento}
                    maxLength={12}
                    onChange={(e) => setComplemento(e.target.value)}
                    required
                    placeholder="Ex: A, B, N1..."
                  />
                </div>
              </div>
              <div>
                <Label>Número da Duplicata (final)</Label>
                <Input
                  value={
                    notaNumber && complemento
                      ? `${notaNumber}-${complemento}`
                      : ""
                  }
                  disabled
                  className="bg-gray-100"
                  tabIndex={-1}
                />
              </div>
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div>
                {/* Espaço para manter alinhamento visual */}
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
                onChange={(file) => setBoletoFile(file)}
                value={value?.pdfBoletoPath || ""}
                accept="application/pdf,.pdf"
                maxSize={15}
                isLoading={isSaving}
                onDelete={
                  value?.pdfBoletoPath && onDeletePdf
                    ? handleDeletePdf
                    : undefined
                }
              />
              <span className="text-xs text-muted-foreground">
                Formato: PDF, até 15MB.
              </span>
            </div>
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="outline" type="button" disabled={isSaving}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-ferplas-500 hover:bg-ferplas-600"
                onClick={handleSubmit}
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicataForm;
