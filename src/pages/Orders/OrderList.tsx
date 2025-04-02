
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, ShoppingCart, ArrowDown, ArrowUp, Plus, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Order } from '@/types/types';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SortField = 'id' | 'customer' | 'createdAt' | 'user' | 'items' | 'total' | 'status';
type SortDirection = 'asc' | 'desc';

const OrderList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        
        // Fetch orders with customer data
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            customer:customers(*)
          `)
          .order('created_at', { ascending: false });
          
        if (ordersError) throw ordersError;
        
        // Fetch order items for each order
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            // Get order items
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select(`
                *,
                product:products(*)
              `)
              .eq('order_id', order.id);
              
            if (itemsError) {
              console.error(`Error fetching items for order ${order.id}:`, itemsError);
              return {
                ...order,
                items: []
              };
            }
            
            return {
              ...order,
              items: itemsData || []
            };
          })
        );
        
        // Transform to match our Order type
        const transformedOrders: Order[] = ordersWithItems.map(orderData => {
          const items = orderData.items.map(item => ({
            id: item.id,
            productId: item.product_id,
            product: {
              id: item.product.id,
              name: item.product.name,
              description: item.product.description || '',
              listPrice: item.product.list_price,
              weight: item.product.weight,
              quantity: item.product.quantity,
              quantityPerVolume: item.product.quantity_per_volume,
              dimensions: {
                width: item.product.width,
                height: item.product.height,
                length: item.product.length,
              },
              cubicVolume: item.product.cubic_volume,
              categoryId: item.product.category_id,
              subcategoryId: item.product.subcategory_id,
              imageUrl: item.product.image_url,
              createdAt: new Date(item.product.created_at),
              updatedAt: new Date(item.product.updated_at),
            },
            quantity: item.quantity,
            discount: item.discount,
            finalPrice: item.final_price,
            subtotal: item.subtotal,
          }));
          
          return {
            id: orderData.id,
            customerId: orderData.customer_id,
            customer: {
              id: orderData.customer.id,
              companyName: orderData.customer.company_name,
              document: orderData.customer.document,
              salesPersonId: orderData.customer.sales_person_id,
              street: orderData.customer.street,
              number: orderData.customer.number || '',
              noNumber: orderData.customer.no_number,
              complement: orderData.customer.complement || '',
              city: orderData.customer.city,
              state: orderData.customer.state,
              zipCode: orderData.customer.zip_code,
              phone: orderData.customer.phone || '',
              email: orderData.customer.email || '',
              defaultDiscount: orderData.customer.default_discount,
              maxDiscount: orderData.customer.max_discount,
              createdAt: new Date(orderData.customer.created_at),
              updatedAt: new Date(orderData.customer.updated_at),
            },
            userId: orderData.user_id,
            user: {
              id: orderData.user_id,
              username: 'user', // We don't have this in DB yet
              name: 'User', // We don't have this in DB yet
              role: 'salesperson' as const,
              permissions: [],
              email: '',
              createdAt: new Date(),
            },
            items: items,
            appliedDiscounts: [], // We'll ignore this for the listing
            totalDiscount: orderData.total_discount,
            subtotal: orderData.subtotal,
            total: orderData.total,
            status: orderData.status as Order['status'],
            shipping: orderData.shipping as 'delivery' | 'pickup',
            fullInvoice: orderData.full_invoice,
            taxSubstitution: orderData.tax_substitution,
            paymentMethod: orderData.payment_method as 'cash' | 'credit',
            paymentTerms: orderData.payment_terms || undefined,
            notes: orderData.notes || '',
            createdAt: new Date(orderData.created_at),
            updatedAt: new Date(orderData.updated_at),
            deliveryLocation: orderData.delivery_location as 'capital' | 'interior' | null || null,
          };
        });
        
        setOrders(transformedOrders);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Falha ao carregar os pedidos. Tente novamente.');
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = new Date();
      matchesDate = order.createdAt.toDateString() === today.toDateString();
    } else if (dateFilter === 'week') {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      matchesDate = order.createdAt >= weekAgo;
    } else if (dateFilter === 'month') {
      const today = new Date();
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      matchesDate = order.createdAt >= monthAgo;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'id':
        return modifier * a.id.localeCompare(b.id);
      case 'customer':
        return modifier * a.customer.companyName.localeCompare(b.customer.companyName);
      case 'createdAt':
        return modifier * (a.createdAt.getTime() - b.createdAt.getTime());
      case 'user':
        return modifier * a.user.name.localeCompare(b.user.name);
      case 'items':
        return modifier * (a.items.length - b.items.length);
      case 'total':
        return modifier * (a.total - b.total);
      case 'status':
        return modifier * a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />;
    }
    return null;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {children}
        {renderSortIndicator(field)}
      </div>
    </TableHead>
  );

  const handleEditClick = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    navigate(`/orders/${orderId}/edit`);
  };

  const handleOrderClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleGenerateInvoice = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    console.log(`Generating invoice for order: ${orderId}`);
    alert('Gerando nota fiscal...');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">
            Consulte e gerencie os pedidos da Ferplas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por número ou cliente..."
                className="pl-10 input-transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="invoiced">Faturado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Período" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-ferplas-500" />
              <span className="ml-2 text-lg text-gray-600">Carregando pedidos...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="id">Pedido</SortableHeader>
                  <SortableHeader field="customer">Cliente</SortableHeader>
                  <SortableHeader field="createdAt">Data</SortableHeader>
                  <SortableHeader field="user">Vendedor</SortableHeader>
                  <SortableHeader field="items">Itens</SortableHeader>
                  <SortableHeader field="total">Valor</SortableHeader>
                  <SortableHeader field="status">Status</SortableHeader>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(order => (
                  <TableRow 
                    key={order.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleOrderClick(order.id)}
                  >
                    <TableCell className="font-medium">#{order.id.slice(-4)}</TableCell>
                    <TableCell>{order.customer.companyName}</TableCell>
                    <TableCell>
                      {format(order.createdAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{order.user.name}</TableCell>
                    <TableCell>{order.items.length}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2"
                          onClick={(e) => handleEditClick(e, order.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2"
                          onClick={(e) => handleGenerateInvoice(e, order.id)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Nota
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!isLoading && filteredOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-600">Nenhum pedido encontrado</h2>
              <p className="text-gray-500 mt-1">
                {orders.length === 0 
                  ? "Ainda não existem pedidos registrados no sistema. Clique em 'Novo Pedido' para criar um novo pedido."
                  : "Tente ajustar seus filtros ou realizar uma nova busca."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderList;
