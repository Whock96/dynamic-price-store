
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, File, Download, Upload, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Order } from '@/types/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceCardProps {
  order: Order;
  onDelete: () => Promise<void>;
}

export const InvoiceCard = ({ order, onDelete }: InvoiceCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDelete = async () => {
    if (!order.invoicePdfPath) return;

    if (confirm('Tem certeza que deseja excluir este arquivo?')) {
      try {
        // Extract filename from URL
        const fileUrl = new URL(order.invoicePdfPath);
        const pathParts = fileUrl.pathname.split('/');
        // The last part of the path should be the filename
        const fileName = pathParts[pathParts.length - 1];
        
        console.log('Deleting file:', fileName);
        
        const { error } = await supabase.storage
          .from('invoice_pdfs')
          .remove([fileName]);

        if (error) {
          console.error('Error deleting PDF:', error);
          throw error;
        }
        
        await onDelete();
        toast.success('Arquivo excluído com sucesso');
      } catch (error) {
        console.error('Error deleting PDF:', error);
        toast.error('Erro ao excluir arquivo');
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Informações de Faturamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Número da Nota Fiscal</h3>
            <p className="text-lg font-semibold">
              {order.invoiceNumber || "Não informado"}
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Arquivo PDF NFe</h3>
            {!order.invoicePdfPath ? (
              <div className="text-center p-4 border border-dashed rounded-md">
                <p className="text-muted-foreground mb-2">Nenhum arquivo PDF anexado</p>
                {user?.role === 'administrator' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/orders/${order.id}/edit`)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Adicionar PDF
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                <div className="flex items-center">
                  <File className="h-8 w-8 text-red-500 mr-3" />
                  <div>
                    <p className="font-medium">Nota Fiscal {order.invoiceNumber || ""}</p>
                    <p className="text-sm text-muted-foreground">PDF anexado</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(order.invoicePdfPath, '_blank')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                  
                  {user?.role === 'administrator' && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleDelete}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
