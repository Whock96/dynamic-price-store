
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrders } from '@/context/OrderContext';
import { useTransportCompanies } from '@/context/TransportCompanyContext';
import { 
  Loader2, ChevronLeft, Check, Save, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import StatusBadge from '@/components/orders/StatusBadge';

const OrderUpdate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById, updateOrder, isLoading } = useOrders();
  const { companies } = useTransportCompanies();
  const [order, setOrder] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isResetAlertOpen, setIsResetAlertOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const currentOrder = getOrderById(id);
      if (currentOrder) {
        setOrder(currentOrder);
        setFormData({
          status: currentOrder.status,
          paymentMethod: currentOrder.paymentMethod,
          paymentTerms: currentOrder.paymentTerms || '',
          shipping: currentOrder.shipping,
          fullInvoice: currentOrder.fullInvoice,
          taxSubstitution: currentOrder.taxSubstitution,
          deliveryLocation: currentOrder.deliveryLocation || null,
          notes: currentOrder.notes || '',
          transportCompanyId: currentOrder.transportCompanyId || ''
        });
      } else {
        toast.error("Pedido não encontrado");
        navigate('/orders');
      }
    }
  }, [id, getOrderById, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !order) return;

    setIsSaving(true);
    try {
      // Only update the fields that have been modified
      const result = await updateOrder(id, formData);
      if (result) {
        toast.success("Pedido atualizado com sucesso!");
        navigate(`/orders/${id}`);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Erro ao atualizar pedido");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    if (order) {
      setFormData({
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentTerms: order.paymentTerms || '',
        shipping: order.shipping,
        fullInvoice: order.fullInvoice,
        taxSubstitution: order.taxSubstitution,
        deliveryLocation: order.deliveryLocation || null,
        notes: order.notes || '',
        transportCompanyId: order.transportCompanyId || ''
      });
    }
    setIsResetAlertOpen(false);
  };

  if (isLoading || !order) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2 p-0 h-9 w-9" 
            onClick={() => navigate(`/orders/${id}`)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Editar Pedido #{order.orderNumber || order.id.substring(0, 8)}
            </h1>
            <p className="text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        
        <StatusBadge status={order.status} />
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Order Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status do Pedido</Label>
                  <Select 
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="invoiced">Faturado</SelectItem>
                      <SelectItem value="completed">Completo</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                    <Select 
                      value={formData.paymentMethod}
                      onValueChange={(value) => handleSelectChange('paymentMethod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">À Vista</SelectItem>
                        <SelectItem value="credit">A Prazo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Condições de Pagamento</Label>
                    <Input
                      id="paymentTerms"
                      name="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={handleInputChange}
                      placeholder="Ex: 28/45/60 dias"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Tipo de Entrega</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={formData.shipping === 'pickup' ? 'default' : 'outline'}
                      className={formData.shipping === 'pickup' ? 'bg-ferplas-500 hover:bg-ferplas-600' : ''}
                      onClick={() => handleSelectChange('shipping', 'pickup')}
                    >
                      <Check className={cn(
                        "mr-2 h-4 w-4",
                        formData.shipping === 'pickup' ? 'opacity-100' : 'opacity-0'
                      )} />
                      Retirada
                    </Button>
                    
                    <Button
                      type="button"
                      variant={formData.shipping === 'delivery' ? 'default' : 'outline'}
                      className={formData.shipping === 'delivery' ? 'bg-ferplas-500 hover:bg-ferplas-600' : ''}
                      onClick={() => handleSelectChange('shipping', 'delivery')}
                    >
                      <Check className={cn(
                        "mr-2 h-4 w-4",
                        formData.shipping === 'delivery' ? 'opacity-100' : 'opacity-0'
                      )} />
                      Entrega
                    </Button>
                  </div>
                </div>
                
                {formData.shipping === 'delivery' && (
                  <div className="space-y-2">
                    <Label>Local de Entrega</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={formData.deliveryLocation === 'capital' ? 'default' : 'outline'}
                        className={formData.deliveryLocation === 'capital' ? 'bg-ferplas-500 hover:bg-ferplas-600' : ''}
                        onClick={() => handleSelectChange('deliveryLocation', 'capital')}
                      >
                        <Check className={cn(
                          "mr-2 h-4 w-4",
                          formData.deliveryLocation === 'capital' ? 'opacity-100' : 'opacity-0'
                        )} />
                        Capital
                      </Button>
                      
                      <Button
                        type="button"
                        variant={formData.deliveryLocation === 'interior' ? 'default' : 'outline'}
                        className={formData.deliveryLocation === 'interior' ? 'bg-ferplas-500 hover:bg-ferplas-600' : ''}
                        onClick={() => handleSelectChange('deliveryLocation', 'interior')}
                      >
                        <Check className={cn(
                          "mr-2 h-4 w-4",
                          formData.deliveryLocation === 'interior' ? 'opacity-100' : 'opacity-0'
                        )} />
                        Interior
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Add transport company selector - only visible for delivery */}
                {formData.shipping === 'delivery' && (
                  <div className="space-y-2">
                    <Label htmlFor="transportCompanyId">Transportadora</Label>
                    <Select 
                      value={formData.transportCompanyId || ''}
                      onValueChange={(value) => handleSelectChange('transportCompanyId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a transportadora" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma transportadora</SelectItem>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Opções de Nota Fiscal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fullInvoice" className="cursor-pointer">NF Completa</Label>
                  <Switch
                    id="fullInvoice"
                    checked={formData.fullInvoice}
                    onCheckedChange={(checked) => handleSwitchChange('fullInvoice', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="taxSubstitution" className="cursor-pointer">Substituição Tributária</Label>
                  <Switch
                    id="taxSubstitution"
                    checked={formData.taxSubstitution}
                    onCheckedChange={(checked) => handleSwitchChange('taxSubstitution', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Additional Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Adicione observações sobre o pedido..."
                  rows={6}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  type="submit"
                  className="w-full bg-ferplas-500 hover:bg-ferplas-600"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
                
                <AlertDialog open={isResetAlertOpen} onOpenChange={setIsResetAlertOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Descartar Alterações
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Descartar Alterações?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja descartar todas as alterações feitas? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={resetForm}>
                        Sim, descartar alterações
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate(`/orders/${id}`)}
                >
                  Voltar sem Salvar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OrderUpdate;
