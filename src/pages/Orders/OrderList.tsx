
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Edit3, Trash2, Search, Printer } from 'lucide-react';
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

// Define custom type that includes joined tables
interface OrderWithCustomer extends Tables<'orders'> {
  customers: Tables<'customers'>;
}

const OrderList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  // Use the orders context instead of local state
  const { orders, isLoading, fetchOrders, deleteOrder } = useOrders();
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Fetch orders through the context
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = orders.filter(order => {
        const customerName = order.customer?.companyName?.toLowerCase() || '';
        const orderNumber = String(order.orderNumber || '');
        
        return customerName.includes(lowercasedSearch) || 
               orderNumber.includes(lowercasedSearch);
      });
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const confirmDelete = (id: string) => {
    setSelectedOrderId(id);
    setIsAlertOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrderId) return;
    
    try {
      await deleteOrder(selectedOrderId);
      // No need to update local state, as deleteOrder will call fetch orders
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Erro ao excluir pedido');
    } finally {
      setIsAlertOpen(false);
      setSelectedOrderId(null);
    }
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
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => navigate(`/orders/${order.id}/edit`)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => confirmDelete(order.id)}
                                className="text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
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
