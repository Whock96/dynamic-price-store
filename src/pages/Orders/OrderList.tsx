import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Edit3, Trash2, Search, Printer, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Order } from '@/types/types';
import { useNavigate } from 'react-router-dom';
import { supabase, Tables } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";
import { supabaseOrderToAppOrder } from '@/utils/adapters';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';

// Define custom type that includes joined tables
interface OrderWithCustomer extends Tables<'orders'> {
  customers: Tables<'customers'>;
}

const OrderList = () => {
  const navigate = useNavigate();
  const { orders: contextOrders, isLoading: contextLoading, deleteOrder } = useOrders();
  const { user: currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [directFetchRequired, setDirectFetchRequired] = useState(false);

  // Use orders from context but fetch directly if needed
  useEffect(() => {
    if (!contextLoading && contextOrders.length > 0) {
      console.log("Using orders from context:", contextOrders.length);
      console.log("Order list user details:", contextOrders.map(o => ({ 
        id: o.id, 
        userId: o.userId, 
        userName: o.user?.name 
      })));
      
      // SOLUÇÃO AQUI - Implementando filtragem rigorosa para garantir que vendedores só vejam seus próprios pedidos
      let ordersToDisplay = [...contextOrders];
      
      if (currentUser?.role === 'salesperson' && currentUser?.id) {
        console.log("OrderList - Filtragem rigorosa para vendedor:", currentUser.id, "(tipo:", typeof currentUser.id, ")");
        console.log("Antes da filtragem:", ordersToDisplay.length, "pedidos");
        
        const currentUserIdStr = String(currentUser.id);
        
        ordersToDisplay = ordersToDisplay.filter(order => {
          const orderUserIdStr = String(order.userId);
          const matches = orderUserIdStr === currentUserIdStr;
          
          console.log(`OrderList - Comparando pedido #${order.orderNumber}: ID do vendedor ${orderUserIdStr} vs ID do usuário atual ${currentUserIdStr} = ${matches}`);
          
          return matches;
        });
        
        console.log("Após filtragem rigorosa:", ordersToDisplay.length, "pedidos");
      }
      
      setOrders(ordersToDisplay);
      setIsLoading(false);
      setDirectFetchRequired(false);
    } else if (contextLoading) {
      console.log("Context is still loading, waiting...");
    } else {
      console.log("Context has no orders, setting direct fetch required");
      setDirectFetchRequired(true);
    }
  }, [contextOrders, contextLoading, currentUser]);

  // Only fetch directly when necessary and when context has finished loading
  useEffect(() => {
    if (directFetchRequired && !contextLoading) {
      console.log("Fetching orders directly from Supabase");
      fetchOrders();
    }
  }, [directFetchRequired, contextLoading]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // SOLUÇÃO AQUI - Garantindo que a consulta seja filtrada corretamente
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `);
      
      if (currentUser?.role === 'salesperson' && currentUser?.id) {
        const currentUserIdStr = String(currentUser.id);
        console.log("OrderList - Filtrando consulta Supabase para vendedor:", currentUserIdStr);
        
        // Garantindo que estamos usando string para o filtro
        query = query.eq('user_id', currentUserIdStr);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data) {
        console.log("Pedidos recuperados diretamente:", data);
        
        // Process each order to fetch items and applied discounts
        const processedOrders = await Promise.all(data.map(async (order) => {
          // Fetch order items with product details
          const { data: itemsData } = await supabase
            .from('order_items')
            .select(`
              *,
              products(*)
            `)
            .eq('order_id', order.id);
            
          // Fetch discount options applied to this order
          const { data: discountData } = await supabase
            .from('order_discounts')
            .select('discount_id')
            .eq('order_id', order.id);
            
          // Fetch full discount details if there are any applied discounts
          let discounts = [];
          if (discountData && discountData.length > 0) {
            const discountIds = discountData.map(d => d.discount_id);
            const { data: discountDetails } = await supabase
              .from('discount_options')
              .select('*')
              .in('id', discountIds);
              
            if (discountDetails) {
              discounts = discountDetails.map(d => ({
                id: d.id,
                name: d.name,
                description: d.description || '',
                value: d.value,
                type: d.type as 'discount' | 'surcharge',
                isActive: d.is_active,
              }));
            }
          }
          
          // SOLUÇÃO AQUI - Garantindo que o nome do usuário seja recuperado corretamente
          let userName = null;
          if (order.user_id) {
            console.log("OrderList - Verificando ID de usuário:", order.user_id, "(tipo:", typeof order.user_id, ")");
            
            const orderUserIdStr = String(order.user_id);
            const currentUserIdStr = currentUser ? String(currentUser.id) : '';
            
            // Comparando strings para evitar problemas de tipo
            if (currentUser && currentUserIdStr === orderUserIdStr) {
              userName = currentUser.name;
              console.log("OrderList - Usando nome do usuário atual:", userName);
            } else {
              const { data: userData } = await supabase
                .from('users')
                .select('name')
                .eq('id', order.user_id)
                .single();
                
              if (userData && userData.name) {
                userName = userData.name;
                console.log("OrderList - Nome do usuário recuperado do BD:", userName);
              } else {
                console.log("OrderList - Não foi possível encontrar usuário com ID:", order.user_id);
                userName = 'Usuário do Sistema';
              }
            }
          } else {
            userName = 'Usuário do Sistema';
          }
          
          // Use adapter to convert Supabase order to app Order
          const appOrder = supabaseOrderToAppOrder(order, itemsData || [], discounts);
          
          // Only add the user name if we actually found one
          if (userName) {
            appOrder.user = {
              ...appOrder.user,
              name: userName
            };
          }
          
          // Garantir que registramos informações completas para debugging
          console.log("OrderList - Pedido processado:", {
            id: order.id,
            orderNumber: order.order_number,
            userId: order.user_id,
            userName
          });
          
          return appOrder;
        }));
        
        // Verificação adicional de filtragem - SOLUÇÃO AQUI
        let finalOrders = [...processedOrders];
        
        if (currentUser?.role === 'salesperson' && currentUser?.id) {
          const currentUserIdStr = String(currentUser.id);
          console.log("OrderList - Aplicando filtragem final para vendedor:", currentUserIdStr);
          
          finalOrders = finalOrders.filter(order => {
            const orderUserIdStr = String(order.userId);
            const matches = orderUserIdStr === currentUserIdStr;
            
            console.log(`OrderList - Filtragem final: pedido #${order.orderNumber}, userID ${orderUserIdStr} vs ${currentUserIdStr} = ${matches}`);
            
            return matches;
          });
          
          console.log(`OrderList - Resultado final: ${finalOrders.length} de ${processedOrders.length} pedidos`);
        }
        
        setOrders(finalOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = orders.filter(order => {
        const customerName = order.customer?.companyName?.toLowerCase() || '';
        const orderNumber = String(order.orderNumber);
        const salesPersonName = order.user?.name?.toLowerCase() || '';
        
        return customerName.includes(lowercasedSearch) || 
               orderNumber.includes(lowercasedSearch) ||
               salesPersonName.includes(lowercasedSearch);
      });
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const handleDeleteOrder = async () => {
    if (!selectedOrderId) return;
    
    try {
      await deleteOrder(selectedOrderId);
      setOrders(orders.filter(order => order.id !== selectedOrderId));
      setFilteredOrders(filteredOrders.filter(order => order.id !== selectedOrderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Erro ao excluir pedido');
    } finally {
      setIsAlertOpen(false);
      setSelectedOrderId(null);
    }
  };

  const confirmDelete = (id: string) => {
    setSelectedOrderId(id);
    setIsAlertOpen(true);
  };

  return (
    <>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <Button onClick={() => navigate('/cart')} className="bg-ferplas-500 hover:bg-ferplas-600">
            <Plus className="mr-2 h-4 w-4" /> Novo Pedido
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Pedidos</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pedidos..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                          <TableCell>{order.customer?.companyName || "Cliente desconhecido"}</TableCell>
                          <TableCell>{order.user?.name || "Não informado"}</TableCell>
                          <TableCell>{formatDate(new Date(order.createdAt))}</TableCell>
                          <TableCell>{formatCurrency(order.total)}</TableCell>
                          <TableCell>
                            <OrderStatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => navigate(`/orders/${order.id}`)}
                                title="Ver detalhes"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => navigate(`/orders/${order.id}/edit`)}
                                title="Editar"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => confirmDelete(order.id)}
                                className="text-red-500 hover:bg-red-50"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => window.open(`/orders/${order.id}`, '_blank')}
                                title="Abrir em nova aba"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nenhum pedido encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrderList;
