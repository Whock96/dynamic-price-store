import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Package, User, Calendar, Truck, Receipt, ShoppingCart, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Order, Customer, CartItem } from '@/types/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useOrders } from '@/context/OrderContext';
import { Slider } from '@/components/ui/slider';
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

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "invoiced", label: "Faturado" },
  { value: "completed", label: "Concluído" },
  { value: "canceled", label: "Cancelado" },
];

const OrderUpdate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getOrderById, updateOrder, deleteOrder } = useOrders();
  
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Order["status"]>("pending");
  const [shipping, setShipping] = useState<"delivery" | "pickup">("delivery");
  const [fullInvoice, setFullInvoice] = useState(false);
  const [taxSubstitution, setTaxSubstitution] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState<'capital' | 'interior' | null>(null);
  const [halfInvoicePercentage, setHalfInvoicePercentage] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [selectedDiscountOptions, setSelectedDiscountOptions] = useState<string[]>([]);
  
  useEffect(() => {
    if (!id) return;
    
    setIsLoading(true);
    console.log(`Loading order with ID: ${id}`);
    
    const orderData = getOrderById(id);
    console.log(`Fetched order:`, orderData);
    
    if (orderData) {
      setOrder(orderData);
      
      setNotes(orderData.notes || orderData.observations || "");
      setStatus(orderData.status);
      
      setShipping(orderData.shipping === "pickup" ? "pickup" : "delivery");
      
      setFullInvoice(Boolean(orderData.fullInvoice));
      setTaxSubstitution(Boolean(orderData.taxSubstitution));
      
      setPaymentMethod(orderData.paymentMethod === "credit" ? "credit" : "cash");
      
      setPaymentTerms(orderData.paymentTerms || "");
      
      setDeliveryLocation(orderData.deliveryLocation || null);
      
      if (orderData.halfInvoicePercentage) {
        setHalfInvoicePercentage(orderData.halfInvoicePercentage);
      }
      
      if (orderData.discountOptions && Array.isArray(orderData.discountOptions)) {
        const discountIds = orderData.discountOptions.map((discount) => discount.id);
        setSelectedDiscountOptions(discountIds);
      } else if (orderData.appliedDiscounts && Array.isArray(orderData.appliedDiscounts)) {
        const discountIds = orderData.appliedDiscounts.map(discount => discount.id);
        setSelectedDiscountOptions(discountIds);
      }
    } else {
      toast.error(`Não foi possível encontrar o pedido com ID: ${id}`);
      navigate('/orders');
    }
    
    setIsLoading(false);
  }, [id, getOrderById, navigate]);
  
  const handleStatusChange = (value: string) => {
    if (
      value === "pending" || 
      value === "confirmed" || 
      value === "invoiced" || 
      value === "completed" || 
      value === "canceled"
    ) {
      setStatus(value as Order["status"]);
    }
  };
  
  const handleShippingChange = (value: string) => {
    if (value === "delivery" || value === "pickup") {
      setShipping(value as "delivery" | "pickup");
      
      if (value === "pickup") {
        setDeliveryLocation(null);
      }
    }
  };
  
  const handlePaymentMethodChange = (value: string) => {
    if (value === "cash" || value === "credit") {
      setPaymentMethod(value as "cash" | "credit");
      
      if (value === "cash") {
        setPaymentTerms("");
      }
    }
  };

  const handleDeliveryLocationChange = (value: string) => {
    if (value === 'capital' || value === 'interior') {
      setDeliveryLocation(value as 'capital' | 'interior');
    } else {
      setDeliveryLocation(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order || !id) return;
    
    setIsSaving(true);
    
    try {
      const updatedOrderData: Partial<Order> = {
        status,
        notes,
        shipping,
        fullInvoice,
        taxSubstitution,
        paymentMethod,
        paymentTerms: paymentMethod === "credit" ? paymentTerms : undefined,
        deliveryLocation,
        halfInvoicePercentage: !fullInvoice ? halfInvoicePercentage : undefined,
        observations: notes,
      };
      
      console.log("Saving order with data:", updatedOrderData);
      
      updateOrder(id, updatedOrderData);
      
      toast.success(`Pedido #${id.slice(-4)} foi atualizado com sucesso.`);
      
      navigate(`/orders/${id}`);
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Ocorreu um erro ao salvar as alterações. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    
    setIsDeleting(true);
    
    try {
      deleteOrder(id);
      navigate('/orders');
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Ocorreu um erro ao excluir o pedido. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  const formatDate = (date: Date) => {
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  if (isLoading || !order) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ferplas-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4 text-gray-500"
            onClick={() => navigate(`/orders/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Pedido #{order.id.slice(-4)}</h1>
            <p className="text-muted-foreground">
              Atualize as informações do pedido
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                Excluir Pedido
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Pedido</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button 
            className="bg-ferplas-500 hover:bg-ferplas-600"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium flex items-center">
                <Receipt className="mr-2 h-5 w-5" />
                Status do Pedido
              </CardTitle>
              <CardDescription>Atualize o status atual do pedido</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full md:w-72">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium flex items-center">
                <Truck className="mr-2 h-5 w-5" />
                Entrega e Faturamento
              </CardTitle>
              <CardDescription>Configure as opções de entrega e faturamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base">Tipo de Entrega</Label>
                    <p className="text-sm text-muted-foreground">Como o pedido será entregue ao cliente</p>
                  </div>
                  <Select value={shipping} onValueChange={handleShippingChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">Retirada</SelectItem>
                      <SelectItem value="delivery">Entrega</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {shipping === "delivery" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label className="text-base">Local de Entrega</Label>
                      <p className="text-sm text-muted-foreground">Região onde será entregue</p>
                    </div>
                    <Select 
                      value={deliveryLocation || ''} 
                      onValueChange={handleDeliveryLocationChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o local de entrega" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="capital">Capital</SelectItem>
                        <SelectItem value="interior">Interior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Nota Fiscal Cheia</Label>
                      <p className="text-sm text-muted-foreground">Emitir nota fiscal com valor total</p>
                    </div>
                    <Switch checked={fullInvoice} onCheckedChange={setFullInvoice} />
                  </div>
                </div>

                {!fullInvoice && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base">Percentual da Nota ({halfInvoicePercentage}%)</Label>
                      <p className="text-sm text-muted-foreground">Defina o percentual para meia nota</p>
                    </div>
                    <Slider
                      value={[halfInvoicePercentage]}
                      min={10}
                      max={90}
                      step={5}
                      onValueChange={(values) => setHalfInvoicePercentage(values[0])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>10%</span>
                      <span>50%</span>
                      <span>90%</span>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Substituição Tributária</Label>
                    <p className="text-sm text-muted-foreground">Aplicar acréscimo por substituição tributária</p>
                  </div>
                  <Switch checked={taxSubstitution} onCheckedChange={setTaxSubstitution} />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label className="text-base">Forma de Pagamento</Label>
                    <p className="text-sm text-muted-foreground">Como o cliente irá pagar</p>
                  </div>
                  <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">À Vista</SelectItem>
                      <SelectItem value="credit">A Prazo</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {paymentMethod === "credit" && (
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="paymentTerms" className="text-sm">Prazo de Pagamento</Label>
                      <Input
                        id="paymentTerms"
                        placeholder="Ex: 30/60/90 ou 28 DDL"
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Informe o prazo de pagamento combinado com o cliente</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Observações</CardTitle>
              <CardDescription>Adicione notas ou instruções especiais para o pedido</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Adicione informações importantes sobre o pedido, como instruções de entrega, preferências do cliente, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Itens do Pedido
              </CardTitle>
              <CardDescription>
                Produtos incluídos neste pedido (não podem ser editados aqui)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items && order.items.map((item: CartItem) => (
                  <div key={item.id} className="flex justify-between items-start p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Quantidade: {item.quantity}</span>
                          <span>Desconto: {item.discount}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.finalPrice)} un.
                      </p>
                    </div>
                  </div>
                ))}
                
                {!order.items || order.items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Package className="h-12 w-12 text-gray-300 mb-4" />
                    <h2 className="text-xl font-medium text-gray-600">Nenhum item no pedido</h2>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Número do Pedido</h3>
                <p>{order.id}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Data de Criação</h3>
                <p>{formatDate(new Date(order.createdAt))}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Última Atualização</h3>
                <p>{formatDate(new Date(order.updatedAt))}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status Atual</h3>
                <div className="mt-1">
                  <OrderStatusBadge status={status} />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Vendedor</h3>
                <div className="flex items-center mt-1">
                  <div className="h-6 w-6 rounded-full bg-ferplas-100 flex items-center justify-center mr-2">
                    <User className="h-3 w-3 text-ferplas-600" />
                  </div>
                  <span>{order.user?.name || 'Usuário'}</span>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                <p className="font-medium">{order.customer?.companyName}</p>
                <p className="text-sm">{order.customer?.document}</p>
                <p className="text-sm">{order.customer?.city}/{order.customer?.state}</p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Resumo Financeiro</h3>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Descontos:</span>
                    <span>-{formatCurrency(order.totalDiscount || 0)}</span>
                  </div>
                  {(order.deliveryFee || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Entrega:</span>
                      <span>{formatCurrency(order.deliveryFee || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Pagamento</h3>
                <p>{paymentMethod === "cash" ? "À Vista" : "A Prazo"}</p>
                {paymentMethod === "credit" && paymentTerms && (
                  <p className="text-sm text-gray-600">Prazo: {paymentTerms}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderUpdate;
