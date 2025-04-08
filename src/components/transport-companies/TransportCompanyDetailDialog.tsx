
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TransportCompany } from '@/types/types';
import { formatDate } from '@/utils/formatters';
import { Truck } from 'lucide-react';

interface TransportCompanyDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: TransportCompany;
}

const TransportCompanyDetailDialog: React.FC<TransportCompanyDetailDialogProps> = ({
  open,
  onOpenChange,
  company
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Detalhes da Transportadora
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre a transportadora
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="text-sm font-semibold">{company.name}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
              <p className="text-sm font-semibold">{company.document}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
              <p className="text-sm font-semibold">{formatDate(company.createdAt)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm font-semibold">{company.email || '-'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Telefone</p>
              <p className="text-sm font-semibold">{company.phone || '-'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
              <p className="text-sm font-semibold">{company.whatsapp || '-'}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
            <p className="text-sm font-semibold">{formatDate(company.updatedAt)}</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransportCompanyDetailDialog;
