
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Duplicata } from '@/types/duplicata';
import { X, Download, FileText } from 'lucide-react';

interface DuplicataDetailsDialogProps {
  duplicata: Duplicata | null;
  open: boolean;
  onClose: () => void;
}

const formatCurrency = (val: number | undefined) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
};

const DuplicataDetailsDialog: React.FC<DuplicataDetailsDialogProps> = ({ duplicata, open, onClose }) => {
  if (!duplicata) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Duplicata {duplicata.numeroDuplicata}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Número</h4>
              <p>{duplicata.numeroDuplicata}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Data de Emissão</h4>
              <p>{duplicata.dataEmissao ? format(new Date(duplicata.dataEmissao), "dd/MM/yyyy", { locale: ptBR }) : '-'}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Data de Vencimento</h4>
              <p>{duplicata.dataVencimento ? format(new Date(duplicata.dataVencimento), "dd/MM/yyyy", { locale: ptBR }) : '-'}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Valor</h4>
              <p>{formatCurrency(duplicata.valor)}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Valor de Acréscimo</h4>
              <p>{formatCurrency(duplicata.valorAcrescimo)}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Valor de Desconto</h4>
              <p>{formatCurrency(duplicata.valorDesconto)}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Comissão (%)</h4>
              <p>{duplicata.comissionDuplicata ? `${duplicata.comissionDuplicata}%` : '0%'}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Valor da Comissão</h4>
              <p>{formatCurrency(duplicata.comissionValue)}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Valor Final</h4>
              <p className="text-ferplas-600 font-medium">{formatCurrency(duplicata.valorFinal)}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Modo de Pagamento</h4>
              <p>{duplicata.modoPagamento?.nome || '-'}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Portador</h4>
              <p>{duplicata.portador?.nome || '-'}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Banco</h4>
              <p>{duplicata.banco?.nome || '-'}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Situação</h4>
              <p>{duplicata.paymentStatus?.nome || '-'}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Valor Recebido</h4>
              <p>{duplicata.valorRecebido !== undefined ? formatCurrency(duplicata.valorRecebido) : '-'}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground">Data de Pagamento</h4>
            <p>{duplicata.dataPagamento ? format(new Date(duplicata.dataPagamento), "dd/MM/yyyy", { locale: ptBR }) : '-'}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-sm text-muted-foreground">Banco de Pagamento</h4>
            <p>{duplicata.bancoPagamento?.nome || '-'}</p>
          </div>
          
          {duplicata.pdfBoletoPath && (
            <div className="pt-2">
              <h4 className="font-medium text-sm text-muted-foreground">Boleto</h4>
              <a 
                href={duplicata.pdfBoletoPath} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-ferplas-600 hover:text-ferplas-700 font-medium mt-1"
              >
                <Download size={18} className="mr-1" />
                Baixar PDF do boleto
              </a>
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicataDetailsDialog;
