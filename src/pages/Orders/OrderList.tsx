import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Edit3, Trash2, Search, ExternalLink, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import OrderSearch from '@/components/orders/OrderSearch';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Order } from '@/types/types';
import { useNavigate } from 'react-router-dom';
import { supabase, Tables } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";
import { supabaseOrderToAppOrder } from '@/utils/adapters';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import SortableHeader from '@/components/ui/sortable-header';

interface OrderWithCustomer extends Tables<'orders'> {
  customers: Tables<'customers'>;
}

type SortDirection = 'asc' | 'desc' | null;

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
  
  const [sortKey, setSortKey] = useState<string | null>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const isSalespersonType = currentUser?.userTypeId === 'c5ee0433-3faf-46a4-a516-be7261bfe575';

  useEffect(() => {
    if (!contextLoading && contextOrders.length > 0) {
      console.log("Using orders from context:", contextOrders.length);
      console.log("Order list user details:", contextOrders.map(o => ({ 
        id: o.id, 
        userId: o.userId, 
        userName: o.user?.name 
      })));
      
      let ordersToDisplay = [...contextOrders];
      
      console.log("OrderList - Tipo de usuário do vendedor:", currentUser?.userTypeId);
      console.log("OrderList - É vendedor específico:", isSalespersonType);
      
      if (isSalespersonType && currentUser?.id) {
        console.log("OrderList - Filtragem RIGOROSA para vendedor ESPECÍFICO:", currentUser.id, "(tipo:", typeof currentUser.id, ")");
        console.log("Antes da filtragem:", ordersToDisplay.length, "pedidos");
        
        const currentUserIdStr = String(currentUser.id);
        
        ordersToDisplay = ordersToDisplay.filter(order => {
          const orderUserIdStr = String(order.userId);
          const matches = orderUserIdStr === currentUserIdStr;
          
          console.log(`OrderList - Comparando pedido #${order.orderNumber}: ID do vendedor ${orderUserIdStr} vs ID do usuário atual ${currentUserIdStr} = ${matches}`);
          
          return matches;
        });
        
        console.log("Após filtragem rigorosa para vendedor específico:", ordersToDisplay.length, "pedidos");
      }
      else if (currentUser?.role === 'salesperson' && currentUser?.id) {
        console.log("OrderList - Filtragem padrão para vendedor (role):", currentUser.id, "(tipo:", typeof currentUser.id, ")");
        console.log("Antes da filtragem:", ordersToDisplay.length, "pedidos");
        
        const currentUserIdStr = String(currentUser.id);
        
        ordersToDisplay = ordersToDisplay.filter(order => {
          const orderUserIdStr = String(order.userId);
          const matches = orderUserIdStr === currentUserIdStr;
          
          console.log(`OrderList - Comparando pedido #${order.orderNumber}: ID do vendedor ${orderUserIdStr} vs ID do usuário atual ${currentUserIdStr} = ${matches}`);
          
          return matches;
        });
        
        console.log("Após filtragem padrão para vendedor:", ordersToDisplay.length, "pedidos");
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
  }, [contextOrders, contextLoading, currentUser, isSalespersonType]);

  useEffect(() => {
    if (directFetchRequired && !contextLoading) {
      console.log("Fetching orders directly from Supabase");
      fetchOrders();
    }
  }, [directFetchRequired, contextLoading]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers(*)
        `);
      
      if (isSalespersonType && currentUser?.id) {
        const currentUserIdStr = String(currentUser.id);
        console.log("OrderList - Filtrando consulta Supabase para vendedor ESPECÍFICO:", currentUserIdStr);
        
        query = query.eq('user_id', currentUserIdStr);
      }
      else if (currentUser?.role === 'salesperson' && currentUser?.id) {
        const currentUserIdStr = String(currentUser.id);
        console.log("OrderList - Filtrando consulta Supabase para vendedor (role):", currentUserIdStr);
        
        query = query.eq('user_id', currentUserIdStr);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data) {
        console.log("Pedidos recuperados diretamente:", data);
        
        const processedOrders = await Promise.all(data.map(async (order) => {
          const { data: itemsData } = await supabase
            .from('order_items')
            .select(`
              *,
              products(*)
            `)
            .eq('order_id', order.id);
            
          const { data: discountData } = await supabase
            .from('order_discounts')
            .select('discount_id')
            .eq('order_id', order.id);
            
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
          
          let userName = null;
          if (order.user_id) {
            console.log("OrderList - Verificando ID de usuário:", order.user_id, "(tipo:", typeof order.user_id, ")");
            
            const orderUserIdStr = String(order.user_id);
            const currentUserIdStr = currentUser ? String(currentUser.id) : '';
            
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
          
          const appOrder = supabaseOrderToAppOrder(order, itemsData || [], discounts);
          
          if (userName) {
            appOrder.user = {
              ...appOrder.user,
              name: userName
            };
          }
          
          console.log("OrderList - Pedido processado:", {
            id: order.id,
            orderNumber: order.order_number,
            userId: order.user_id,
            userName
          });
          
          return appOrder;
        }));
        
        let finalOrders = [...processedOrders];
        
        if (isSalespersonType && currentUser?.id) {
          const currentUserIdStr = String(currentUser.id);
          console.log("OrderList - Aplicando filtragem final para vendedor ESPECÍFICO:", currentUserIdStr);
          
          finalOrders = finalOrders.filter(order => {
            const orderUserIdStr = String(order.userId);
            const matches = orderUserIdStr === currentUserIdStr;
            
            console.log(`OrderList - Filtragem final específica: pedido #${order.orderNumber}, userID ${orderUserIdStr} vs ${currentUserIdStr} = ${matches}`);
            
            return matches;
          });
          
          console.log(`OrderList - Resultado final da filtragem específica: ${finalOrders.length} de ${processedOrders.length} pedidos`);
        }
        else if (currentUser?.role === 'salesperson' && currentUser?.id) {
          const currentUserIdStr = String(currentUser.id);
          console.log("OrderList - Aplicando filtragem final para vendedor (role):", currentUserIdStr);
          
          finalOrders = finalOrders.filter(order => {
            const orderUserIdStr = String(order.userId);
            const matches = orderUserIdStr === currentUserIdStr;
            
            console.log(`OrderList - Filtragem final padrão: pedido #${order.orderNumber}, userID ${orderUserIdStr} vs ${currentUserIdStr} = ${matches}`);
            
            return matches;
          });
          
          console.log(`OrderList - Resultado final da filtragem padrão: ${finalOrders.length} de ${processedOrders.length} pedidos`);
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

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === null) {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  useEffect(() => {
    let result = [...orders];
    
    if (startDate && endDate) {
      result = result.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });
    } else if (startDate) {
      result = result.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate;
      });
    } else if (endDate) {
      result = result.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate <= endDate;
      });
    }
    
    if (searchTerm.trim() !== '') {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(order => {
        const customerName = order.customer?.companyName?.toLowerCase() || '';
        const customerDocument = order.customer?.document?.toLowerCase() || '';
        const orderNumber = String(order.orderNumber);
        const salesPersonName = order.user?.name?.toLowerCase() || '';
        
        return customerName.includes(lowercasedSearch) || 
               customerDocument.includes(lowercasedSearch) ||
               orderNumber.includes(lowercasedSearch) ||
               salesPersonName.includes(lowercasedSearch);
      });
    }
    
    if (sortKey && sortDirection) {
      result.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortKey) {
          case 'orderNumber':
            aValue = a.orderNumber;
            bValue = b.orderNumber;
            break;
          case 'customerName':
            aValue = a.customer?.companyName || '';
            bValue = b.customer?.companyName || '';
            break;
          case 'customerDocument':
            aValue = a.customer?.document || '';
            bValue = b.customer?.document || '';
            break;
          case 'salesPerson':
            aValue = a.user?.name || '';
            bValue = b.user?.name || '';
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'total':
            aValue = a.total;
            bValue = b.total;
            break;
          case 'city':
            aValue = a.customer?.city || '';
            bValue = b.customer?.city || '';
            break;
          case 'state':
            aValue = a.customer?.state || '';
            bValue = b.customer?.state || '';
            break;
          default:
            aValue = a[sortKey as keyof Order] || '';
            bValue = b[sortKey as keyof Order] || '';
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        return sortDirection === 'asc' 
          ? (aValue as number) - (bValue as number) 
          : (bValue as number) - (aValue as number);
      });
    }
    
    setFilteredOrders(result);
  }, [orders, searchTerm, sortKey, sortDirection, startDate, endDate]);

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

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchTerm('');
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
            <div className="flex flex-col space-y-4">
              <CardTitle>Lista de Pedidos</CardTitle>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <OrderSearch 
                  searchQuery={searchTerm}
                  setSearchQuery={setSearchTerm}
                />
                
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'P', { locale: ptBR }) : 'Data Inicial'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'P', { locale: ptBR }) : 'Data Final'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Button variant="outline" onClick={resetFilters}>Limpar</Button>
                </div>
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
                      <TableHead className="w-[80px]">
                        <SortableHeader
                          label="Número"
                          sortKey="orderNumber"
                          currentSortKey={sortKey}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Cliente"
                          sortKey="customerName"
                          currentSortKey={sortKey}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="CNPJ"
                          sortKey="customerDocument"
                          currentSortKey={sortKey}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Cidade"
                          sortKey="city"
                          currentSortKey={sortKey}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Estado"
                          sortKey="state"
                          currentSortKey={sortKey}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Vendedor"
                          sortKey="salesPerson"
                          currentSortKey={sortKey}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Data"
                          sortKey="createdAt"
                          currentSortKey={sortKey}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Valor"
                          sortKey="total"
                          currentSortKey={sortKey}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Status"
                          sortKey="status"
                          currentSortKey={sortKey}
                          currentSortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                          <TableCell>{order.customer?.companyName || "Cliente desconhecido"}</TableCell>
                          <TableCell>{order.customer?.document || "—"}</TableCell>
                          <TableCell>{order.customer?.city || "—"}</TableCell>
                          <TableCell>{order.customer?.state || "—"}</TableCell>
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
                        <TableCell colSpan={10} className="h-24 text-center">
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
