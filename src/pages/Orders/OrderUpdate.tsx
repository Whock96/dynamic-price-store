
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Package, ShoppingCart, Trash2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
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

// Simulando o pedido com base no ID da URL (mesma função do OrderDetail)
const getOrderById = (id: string) => {
  // Aqui seria uma chamada à API para buscar o pedido pelo ID
  // Por enquanto, vamos simular um pedido
  const today = new Date();
  const date = new Date(today);
  date.setDate(today.getDate() - Math.floor(Math.random() * 30));
  
  const orderNumber = parseInt(id.split('-')[1], 10);
  
  return {
    id,
    number: `#${10000 + orderNumber - 1}`,
    customerId: `customer-${Math.floor(Math.random() * 10) + 1}`,
    customerName: `Cliente ${Math.floor(Math.random() * 10) + 1} Ltda.`,
    userId: `user-${Math.floor(Math.random() * 3) + 1}`,
    userName: orderNumber % 3 === 0 ? 'João Silva' : orderNumber % 3 === 1 ? 'Maria Oliveira' : 'Carlos Santos',
    items: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
      id: `item-${i}`,
      productId: `product-${i + 1}`,
      productName: `Produto ${i + 1}`,
      quantity: Math.floor(Math.random() * 10) + 1,
      listPrice: Math.floor(Math.random() * 900) + 100,
      discount: Math.floor(Math.random() * 10) + 5,
      finalPrice: Math.floor(Math.random() * 800) + 90,
      subtotal: Math.floor(Math.random() * 8000) + 900,
    })),
    appliedDiscounts: [
      { id: '1', name: 'Retirada', value: 1, type: 'discount' },
      { id: '2', name: 'Meia nota', value: 3, type: 'discount' },
      { id: '4', name: 'A Vista', value: 1, type: 'discount' },
    ],
    shipping: orderNumber % 2 === 0 ? 'delivery' : 'pickup',
    fullInvoice: orderNumber % 2 === 0,
    taxSubstitution: orderNumber % 3 === 0,
    paymentMethod: orderNumber % 2 === 0 ? 'cash' : 'credit',
    notes: 'Observações do cliente: entregar no período da tarde.',
    subtotal: Math.floor(Math.random() * 9000) + 1000,
    totalDiscount: Math.floor(Math.random() * 500) + 100,
    total: Math.floor(Math.random() * 8500) + 900,
    status: 'pending', // Apenas pedidos pendentes podem ser editados
    createdAt: date,
    customer: {
      id: `customer-${Math.floor(Math.random() * 10) + 1}`,
      companyName: `Cliente ${Math.floor(Math.random() * 10) + 1} Ltda.`,
      document: Math.random().toString().slice(2, 13),
      street: `Rua ${Math.floor(Math.random() * 100) + 1}`,
      number: `${Math.floor(Math.random() * 1000) + 1}`,
      complement: orderNumber % 2 === 0 ? `Sala ${Math.floor(Math.random() * 10) + 1}` : '',
      city: orderNumber % 4 === 0 ? 'São Paulo' : orderNumber % 4 === 1 ? 'Rio de Janeiro' : orderNumber % 4 === 2 ? 'Belo Horizonte' : 'Curitiba',
      state: orderNumber % 4 === 0 ? 'SP' : orderNumber % 4 === 1 ? 'RJ' : orderNumber % 4 === 2 ? 'MG' : 'PR',
      zipCode: `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 900) + 100}`,
      phone: `(${Math.floor(Math.random() * 90) + 10}) ${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000) + 1000}`,
      email: `cliente${Math.floor(Math.random() * 100)}@example.com`,
    }
  };
};

// Lista de descontos disponíveis
const AVAILABLE_DISCOUNTS = [
  { id: '1', name: 'Retirada', value: 1, type: 'discount', description: 'Desconto para retirada na loja' },
  { id: '2', name: 'Meia nota', value: 3, type: 'discount', description: 'Desconto para meia nota fiscal' },
  { id: '3', name: 'Substituição tributária', value: 7.8, type: 'surcharge', description: 'Acréscimo para substituição tributária' },
  { id: '4', name: 'A Vista', value: 1, type: 'discount', description: 'Desconto para pagamento à vista' },
];

const OrderUpdate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [shipping, setShipping] = useState<'delivery' | 'pickup'>('pickup');
  const [fullInvoice, setFullInvoice] = useState(false);
  const [taxSubstitution, setTaxSubstitution] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    if (user?.role !== 'administrator') {
      toast.error('Você não tem permissão para editar pedidos');
      navigate('/orders');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (id) {
      // Simulando uma chamada à API
      setTimeout(() => {
        const fetchedOrder = getOrderById(id);
        setOrder(fetchedOrder);
        setStatus(fetchedOrder.status);
        setNotes(fetchedOrder.notes);
        setShipping(fetchedOrder.shipping);
        setFullInvoice(fetchedOrder.fullInvoice);
        setTaxSubstitution(fetchedOrder.taxSubstitution);
        setPaymentMethod(fetchedOrder.paymentMethod);
        setSelectedDiscounts(fetchedOrder.appliedDiscounts.map((d: any) => d.id));
        setLoading(false);
      }, 500);
    }
  }, [id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setOrder((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any) => 
        item.id === itemId 
          ? { 
              ...item, 
              quantity, 
              subtotal: item.finalPrice * quantity 
            } 
          : item
      )
    }));
  };

  const updateItemDiscount = (itemId: string, discount: number) => {
    if (discount < 0) return;
    
    setOrder((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any) => {
        if (item.id === itemId) {
          const finalPrice = item.listPrice * (1 - discount / 100);
          return {
            ...item,
            discount,
            finalPrice,
            subtotal: finalPrice * item.quantity
          };
        }
        return item;
      })
    }));
  };

  const removeItem = (itemId: string) => {
    setOrder((prev: any) => ({
      ...prev,
      items: prev.items.filter((item: any) => item.id !== itemId)
    }));
  };

  const toggleDiscount = (discountId: string) => {
    setSelectedDiscounts(prev => {
      if (prev.includes(discountId)) {
        return prev.filter(id => id !== discountId);
      } else {
        return [...prev, discountId];
      }
    });
  };

  const handleSave = () => {
    if (order.items.length === 0) {
      toast.error('O pedido deve ter pelo menos um item');
      return;
    }

    setSaving(true);
    
    // Calcular novos totais
    const subtotal = order.items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    
    // Simulando uma chamada à API para salvar o pedido
    setTimeout(() => {
      setSaving(false);
      toast.success('Pedido atualizado com sucesso!');
      navigate(`/orders/${id}`);
    }, 1000);
  };

  const handleCancel = () => {
    setOrder((prev: any) => ({
      ...prev,
      status: 'canceled'
    }));
    
    setSaving(true);
    
    // Simulando uma chamada à API para cancelar o pedido
    setTimeout(() => {
      setSaving(false);
      toast.success('Pedido cancelado com sucesso!');
      navigate(`/orders/${id}`);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ferplas-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">Pedido não encontrado</h2>
        <p className="text-gray-500 mt-2">O pedido que você está procurando não existe ou foi removido.</p>
        <Button 
          className="mt-6"
          onClick={() => navigate('/orders')}
        >
          Voltar para lista de pedidos
        </Button>
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
            <h1 className="text-3xl font-bold tracking-tight">Editar Pedido {order.number}</h1>
            <p className="text-muted-foreground">
              Atualize os detalhes do pedido
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Cancelar Pedido
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar pedido?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá cancelar o pedido. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleCancel}
                >
                  Cancelar Pedido
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button 
            className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
              <CardTitle className="text-lg font-medium">Itens do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Preço Unitário</TableHead>
                    <TableHead>Desconto (%)</TableHead>
                    <TableHead>Preço Final</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead className="w-14"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{formatCurrency(item.listPrice)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => updateItemDiscount(item.id, Number(e.target.value))}
                          className="w-20 h-8 text-center"
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(item.finalPrice)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.id, Number(e.target.value) || 1)}
                            className="w-14 h-8 mx-1 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8"
                          >
                            +
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {order.items.length === 0 && (
                <div className="h-32 flex flex-col items-center justify-center text-center border rounded-md border-dashed p-4">
                  <ShoppingCart className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-gray-500">Sem itens no pedido</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => navigate('/products')}
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Adicionar Produtos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Descontos Aplicados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {AVAILABLE_DISCOUNTS.map(discount => (
                  <div key={discount.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-ferplas-100 flex items-center justify-center mr-3">
                        {discount.type === 'discount' ? '-' : '+'}
                      </div>
                      <div>
                        <p className="font-medium">{discount.name}</p>
                        <p className="text-sm text-gray-500">
                          {discount.type === 'discount' ? '-' : '+'}{discount.value}% - {discount.description}
                        </p>
                      </div>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        checked={selectedDiscounts.includes(discount.id)}
                        onChange={() => toggleDiscount(discount.id)}
                        className="h-6 w-6 rounded-md border-gray-300 text-ferplas-600 focus:ring-ferplas-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Observações adicionais sobre o pedido..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-lg text-ferplas-600">{order.customer.companyName}</h3>
                <p className="text-sm text-gray-500">CNPJ/CPF: {order.customer.document}</p>
                <p className="text-sm text-gray-500">
                  {order.customer.street}, {order.customer.number} {order.customer.complement && `- ${order.customer.complement}`}
                </p>
                <p className="text-sm text-gray-500">
                  {order.customer.city}/{order.customer.state} - {order.customer.zipCode}
                </p>
                <p className="text-sm text-gray-500">
                  {order.customer.phone} | {order.customer.email}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Opções do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(value: string) => setStatus(value)}>
                    <SelectTrigger id="status" className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="shipping">Entrega</Label>
                  <Select value={shipping} onValueChange={(value: 'delivery' | 'pickup') => setShipping(value)}>
                    <SelectTrigger id="shipping" className="w-40">
                      <SelectValue placeholder="Tipo de entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">Retirada</SelectItem>
                      <SelectItem value="delivery">Entrega</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="fullInvoice">Nota Fiscal</Label>
                  <Select 
                    value={fullInvoice ? "full" : "half"} 
                    onValueChange={(value) => setFullInvoice(value === "full")}
                  >
                    <SelectTrigger id="fullInvoice" className="w-40">
                      <SelectValue placeholder="Tipo de nota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Nota Cheia</SelectItem>
                      <SelectItem value="half">Meia Nota</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="taxSubstitution">Substituição Tributária</Label>
                  <Select 
                    value={taxSubstitution ? "yes" : "no"} 
                    onValueChange={(value) => setTaxSubstitution(value === "yes")}
                  >
                    <SelectTrigger id="taxSubstitution" className="w-40">
                      <SelectValue placeholder="Substituição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Sim</SelectItem>
                      <SelectItem value="no">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={(value: 'cash' | 'credit') => setPaymentMethod(value)}>
                    <SelectTrigger id="paymentMethod" className="w-40">
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
              <CardTitle className="text-lg font-medium">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Descontos:</span>
                  <span>-{formatCurrency(order.totalDiscount)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total:</span>
                  <span className="text-ferplas-600">{formatCurrency(order.total)}</span>
                </div>
              </div>
              
              <Button 
                className="w-full mt-4 bg-ferplas-500 hover:bg-ferplas-600 button-transition"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderUpdate;
