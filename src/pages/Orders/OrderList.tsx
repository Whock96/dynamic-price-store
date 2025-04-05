
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
      
      // Check if user is salesperson and filter orders accordingly
      let ordersToUse = [...contextOrders];
      
      // Only filter if the user is a salesperson
      if (currentUser?.role === 'salesperson' && currentUser?.id) {
        console.log("Filtering orders for salesperson:", currentUser.id);
        ordersToUse = ordersToUse.filter(order => order.userId === currentUser.id);
      }
      
      setOrders(ordersToUse);
      setIsLoading(false);
      // We no longer need to fetch directly if context has orders
      setDirectFetchRequired(false);
    } else if (contextLoading) {
      // Don't try to fetch yet, wait for context to finish loading
      console.log("Context is still loading, waiting...");
    } else {
      // If context has finished loading but has no orders, fetch directly
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
      // If user is a salesperson, filter orders by user_id
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `);
      
      // Only filter if the user is a salesperson
      if (currentUser?.role === 'salesperson' && currentUser?.id) {
        console.log("Filtering Supabase query for salesperson:", currentUser.id);
        query = query.eq('user_id', currentUser.id);
      }
      
      // Add ordering regardless of user role
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data) {
        console.log("Fetched orders directly:", data);
        
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
          
          // Start with user name as null instead of default value
          let userName = null;
          if (order.user_id) {
            console.log("OrderList - Checking user ID:", order.user_id);
            
            // Check if it's the current user - use string comparison to avoid type issues
            if (currentUser && String(currentUser.id) === String(order.user_id)) {
              userName = currentUser.name;
              console.log("OrderList - Using current user name:", userName);
            } else {
              // If not the current user, fetch from database
              const { data: userData } = await supabase
                .from('users')
                .select('name')
                .eq('id', order.user_id)
                .single();
                
              if (userData && userData.name) {
                userName = userData.name;
                console.log("OrderList - Fetched user name from DB:", userName);
              } else {
                console.log("OrderList - Could not find user with ID:", order.user_id);
                // Only use default if we truly couldn't find a name
                userName = 'Usuário do Sistema';
              }
            }
          } else {
            // If no user_id at all, then use default
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
          
          console.log("OrderList - Processed order with user:", appOrder.user);
          return appOrder;
        }));
        
        console.log("Final processed orders with users:", processedOrders.map(o => ({
          id: o.id,
          userId: o.userId,
          userName: o.user?.name
        })));
        
        setOrders(processedOrders);
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
