import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Package, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';
import { Order, Customer, CartItem } from '@/types/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data - order details
const MOCK_ORDER: Order = {
  id: "order-123",
  customerId: "customer-1",
  customer: {
    id: "customer-1",
    companyName: "Empresa Cliente Ltda.",
    document: "12.345.678/0001-90",
    salesPersonId: "1",
    street: "Rua das Indústrias",
    number: "1000",
    noNumber: false,
    complement: "Galpão 7",
    city: "São Paulo",
    state: "SP",
    zipCode: "04000-000",
    phone: "(11) 3000-0000",
    email: "contato@empresa.com",
    defaultDiscount: 5,
    maxDiscount: 10,
    createdAt: new Date(2023, 5, 15),
    updatedAt: new Date(2023, 5, 15),
  },
  userId: "user-1",
  user: {
    id: "user-1",
    username: "vendedor1",
    name: "João Silva",
    role: "salesperson",
    permissions: [],
    email: "joao@example.com",
    createdAt: new Date(2023, 1, 1),
  },
  items: [
    {
      id: "item-1",
      productId: "product-1",
      product: {
        id: "product-1",
        name: "Caixa Plástica Organizadora 50L",
        description: "Caixa plástica resistente para organização e armazenamento",
        listPrice: 89.90,
        minPrice: 75.00,
        weight: 1.5,
        quantity: 100,
        volume: 2,
        categoryId: "1",
        subcategoryId: "1",
        imageUrl: "https://via.placeholder.com/150",
        createdAt: new Date(2023, 1, 1),
        updatedAt: new Date(2023, 3, 15),
      },
      quantity: 10,
      discount: 5,
      finalPrice: 85.41,
      subtotal: 854.10
    },
    {
      id: "item-2",
      productId: "product-2",
      product: {
        id: "product-2",
        name: "Contêiner Plástico 100L",
        description: "Contêiner plástico industrial para armazenamento",
        listPrice: 259.90,
        minPrice: 220.00,
        weight: 5.2,
        quantity: 50,
        volume: 3,
        categoryId: "1",
        subcategoryId: "2",
        imageUrl: "https://via.placeholder.com/150",
        createdAt: new Date(2023, 1, 1),
        updatedAt: new Date(2023, 3, 15),
      },
      quantity: 5,
      discount: 8,
      finalPrice: 239.11,
      subtotal: 1195.55
    }
  ],
  appliedDiscounts: [
    {
      id: "1",
      name: "Retirada",
      description: "Desconto para retirada na loja",
      value: 1,
      type: "discount",
      isActive: true,
    },
    {
      id: "2",
      name: "Meia nota",
      description: "Desconto para meia nota fiscal",
      value: 3,
      type: "discount",
      isActive: true,
    }
  ],
  totalDiscount: 204.95,
  subtotal: 2049.50,
  total: 1844.55,
  status: "pending",
  shipping: "pickup",
  fullInvoice: false,
  taxSubstitution: false,
  paymentMethod: "cash",
  notes: "Pedido prioritário para entrega. Cliente solicita entrega para o dia 20/06.",
  createdAt: new Date(2023, 5, 15, 14, 30),
  updatedAt: new Date(2023, 5, 15, 14, 30),
};

// Status options - updated to match the Order type
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
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"pending" | "confirmed" | "invoiced" | "completed" | "canceled">("pending");
  const [shipping, setShipping] = useState<"delivery" | "pickup">("delivery");
  const [fullInvoice, setFullInvoice] = useState(false);
  const [taxSubstitution, setTaxSubstitution] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash");
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    // In a real app, this would be an API call
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setOrder(MOCK_ORDER);
      setNotes(MOCK_ORDER.notes);
      setStatus(MOCK_ORDER.status);
      setShipping(MOCK_ORDER.shipping);
      setFullInvoice(MOCK_ORDER.fullInvoice);
      setTaxSubstitution(MOCK_ORDER.taxSubstitution);
      setPaymentMethod(MOCK_ORDER.paymentMethod);
      setIsLoading(false);
    }, 1000);
  }, [id]);
  
  const handleStatusChange = (value: string) => {
    if (
      value === "pending" || 
      value === "confirmed" || 
      value === "invoiced" || 
      value === "completed" || 
      value === "canceled"
    ) {
      setStatus(value as "pending" | "confirmed" | "invoiced" | "completed" | "canceled");
    }
  };
  
  const handleShippingChange = (value: string) => {
    if (value === "delivery" || value === "pickup") {
      setShipping(value as "delivery" | "pickup");
    }
  };
  
  const handlePaymentMethodChange = (value: string) => {
    if (value === "cash" || value === "credit") {
      setPaymentMethod(value as "cash" | "credit");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order) return;
    
    setIsSaving(true);
    
    // In a real app, this would be an API call
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Pedido atualizado",
        description: `Pedido #${order.id.slice(-4)} foi atualizado com sucesso.`,
      });
      
      navigate(`/orders/${id}`);
    } catch (error) {
      toast({
        title: "Erro ao atualizar pedido",
        description: "Ocorreu um erro ao salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Status do Pedido</CardTitle>
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
              
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Tipo de Entrega</Label>
                    <p className="text-sm text-muted-foreground">Como o pedido será entregue ao cliente</p>
                  </div>
                  <Select value={shipping} onValueChange={handleShippingChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">Retirada</SelectItem>
                      <SelectItem value="delivery">Entrega</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Nota Fiscal Cheia</Label>
                    <p className="text-sm text-muted-foreground">Emitir nota fiscal com valor total</p>
                  </div>
                  <Switch checked={fullInvoice} onCheckedChange={setFullInvoice} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Substituição Tributária</Label>
                    <p className="text-sm text-muted-foreground">Aplicar acréscimo por substituição tributária</p>
                  </div>
                  <Switch checked={taxSubstitution} onCheckedChange={setTaxSubstitution} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Forma de Pagamento</Label>
                    <p className="text-sm text-muted-foreground">Como o cliente irá pagar</p>
                  </div>
                  <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">À Vista</SelectItem>
                      <SelectItem value="credit">A Prazo</SelectItem>
                    </SelectContent>
                  </Select>
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
              <CardTitle className="text-lg font-medium">Itens do Pedido</CardTitle>
              <CardDescription>
                Produtos incluídos neste pedido (não podem ser editados aqui)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item: CartItem) => (
                  <div key={item.id} className="flex justify-between items-start p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium">{item.product.name}</p>
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
                <p>{formatDate(order.createdAt)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Última Atualização</h3>
                <p>{formatDate(order.updatedAt)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status Atual</h3>
                <div className="mt-1">
                  {status === "pending" && (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>
                  )}
                  {status === "confirmed" && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">Confirmado</Badge>
                  )}
                  {status === "delivered" && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">Entregue</Badge>
                  )}
                  {status === "canceled" && (
                    <Badge className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>
                  )}
                  {status === "invoiced" && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">Faturado</Badge>
                  )}
                  {status === "completed" && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">Concluído</Badge>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Vendedor</h3>
                <div className="flex items-center mt-1">
                  <div className="h-6 w-6 rounded-full bg-ferplas-100 flex items-center justify-center mr-2">
                    <User className="h-3 w-3 text-ferplas-600" />
                  </div>
                  <span>{order.user.name}</span>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                <p className="font-medium">{order.customer.companyName}</p>
                <p className="text-sm">{order.customer.document}</p>
                <p className="text-sm">{order.customer.city}/{order.customer.state}</p>
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
                    <span>-{formatCurrency(order.totalDiscount)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderUpdate;
