import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Edit, Loader2, Printer, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { Order, CartItem } from '@/types/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import OrderPrint from '@/components/OrderPrint';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
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
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTransportCompanies } from '@/context/TransportCompanyContext';

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById, updateOrderStatus, updateOrder } = useOrders();
  const { user } = useAuth();
  const [orderData, setOrderData] = useState<Order | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status']>('pending');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditingUserId, setIsEditingUserId] = useState(false);
  const [newUserId, setNewUserId] = useState<string | undefined>(undefined);
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([]);
  const componentRef = React.useRef(null);
  const { transportCompanies } = useTransportCompanies();
  
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        if (id) {
          const order = getOrderById(id);
          if (order) {
            setOrderData(order);
            setNewStatus(order.status);
          } else {
            toast.error('Pedido não encontrado');
            navigate('/orders');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate, getOrderById]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const usersData = await response.json();
        setAllUsers(usersData);
      } catch (error) {
        console.error("Could not fetch users:", error);
        toast.error('Erro ao carregar usuários');
      }
    };
    
    fetchUsers();
  }, []);

  const handleStatusUpdate = async () => {
    setIsUpdatingStatus(true);
    try {
      if (id) {
        await updateOrderStatus(id, newStatus);
        toast.success('Status do pedido atualizado com sucesso!');
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erro ao atualizar status do pedido');
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  const handleUserIdUpdate = async () => {
    setIsUpdatingStatus(true);
    try {
      if (id && newUserId) {
        await updateOrder(id, { userId: newUserId });
        toast.success('Usuário do pedido atualizado com sucesso!');
        setIsEditingUserId(false);
        
        // Optimistically update the local state
        setOrderData(prevOrderData => {
          if (prevOrderData) {
            return {
              ...prevOrderData,
              userId: newUserId,
              user: {
                ...prevOrderData.user,
                id: newUserId,
                name: allUsers.find(u => u.id === newUserId)?.name || 'Usuário do Sistema'
              }
            };
          }
          return prevOrderData;
        });
      }
    } catch (error) {
      console.error('Error updating order user:', error);
      toast.error('Erro ao atualizar usuário do pedido');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-500 text-white">Confirmado</Badge>;
      case 'invoiced':
        return <Badge className="bg-orange-500 text-white">Faturado</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 text-white">Concluído</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Add function to get transport company name
  const getTransportCompanyName = (id: string | null | undefined) => {
    if (!id) return 'Não especificada';
    const company = transportCompanies.find(c => c.id === id);
    return company ? company.name : 'Não especificada';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => navigate('/orders')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Detalhes do Pedido</h1>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Carregando detalhes do pedido...
        </div>
      ) : !orderData ? (
        <div className="flex items-center justify-center min-h-[200px] text-red-500">
          <AlertTriangle className="mr-2 h-6 w-6" />
          Pedido não encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {orderData.customer.companyName}
                  </p>
                  <p className="text-sm text-gray-500">
                    CNPJ/CPF: {orderData.customer.document}
                  </p>
                  <p className="text-sm text-gray-500">
                    {orderData.customer.street}, {orderData.customer.number} {orderData.customer.complement && `- ${orderData.customer.complement}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {orderData.customer.city}/{orderData.customer.state} - {orderData.customer.zipCode}
                  </p>
                  <p className="text-sm text-gray-500">
                    {orderData.customer.phone} | {orderData.customer.email}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Detalhes do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Número do Pedido</p>
                    <p>#{orderData.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data do Pedido</p>
                    <p>{formatDate(orderData.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vendedor</p>
                    <p>
                      {isEditingUserId ? (
                        <Select
                          value={newUserId || ''}
                          onValueChange={(value) => setNewUserId(value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecionar Vendedor" />
                          </SelectTrigger>
                          <SelectContent>
                            {allUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        orderData.user?.name || 'N/A'
                      )}
                      {user?.role === 'administrator' && (
                        isEditingUserId ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleUserIdUpdate}
                              disabled={isUpdatingStatus}
                            >
                              {isUpdatingStatus ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsEditingUserId(false)}
                              disabled={isUpdatingStatus}
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setIsEditingUserId(true);
                              setNewUserId(orderData.userId);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </p>
                  </div>
                  
                  {orderData && orderData.transportCompanyId && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Transportadora</p>
                      <p>{getTransportCompanyName(orderData.transportCompanyId)}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <div className="flex items-center">
                      {getStatusBadge(orderData.status)}
                      {user?.role === 'administrator' && (
                        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="ml-2">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Editar Status do Pedido</AlertDialogTitle>
                              <AlertDialogDescription>
                                Selecione o novo status para o pedido #{orderData.orderNumber}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogBody newStatus={newStatus} setNewStatus={setNewStatus} />
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleStatusUpdate} disabled={isUpdatingStatus}>
                                {isUpdatingStatus ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                  </>
                                ) : (
                                  'Salvar'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Forma de Envio
                    </p>
                    <p className="capitalize">{orderData.shipping}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Forma de Pagamento
                    </p>
                    <p className="capitalize">{orderData.paymentMethod}</p>
                  </div>
                  {orderData.paymentTerms && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Condições de Pagamento
                      </p>
                      <p>{orderData.paymentTerms}</p>
                    </div>
                  )}
                  {orderData.deliveryLocation && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Local de Entrega
                      </p>
                      <p className="capitalize">{orderData.deliveryLocation}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>
                  Itens do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Preço Unitário</TableHead>
                        <TableHead>Desconto</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderData.items.map((item: CartItem) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.product.listPrice)}</TableCell>
                          <TableCell>{item.discount}%</TableCell>
                          <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {orderData.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{orderData.notes}</p>
                </CardContent>
              </Card>
            )}
            
            {orderData.observations && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Observações Internas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{orderData.observations}</p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <Card className="space-y-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(orderData.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Descontos:</span>
                    <span>-{formatCurrency(orderData.totalDiscount)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(orderData.total)}</span>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-ferplas-500 hover:bg-ferplas-600" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Pedido
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      <div style={{ display: 'none' }}>
        <OrderPrint order={orderData} ref={componentRef} />
      </div>
    </div>
  );
};

interface AlertDialogBodyProps {
  newStatus: Order['status'];
  setNewStatus: (status: Order['status']) => void;
}

const AlertDialogBody: React.FC<AlertDialogBodyProps> = ({ newStatus, setNewStatus }) => (
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <label htmlFor="status" className="text-right sm:text-left flex items-center">
        Novo Status:
      </label>
      <Select value={newStatus} onValueChange={setNewStatus}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecionar Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pendente</SelectItem>
          <SelectItem value="confirmed">Confirmado</SelectItem>
          <SelectItem value="invoiced">Faturado</SelectItem>
          <SelectItem value="completed">Concluído</SelectItem>
          <SelectItem value="canceled">Cancelado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

export default OrderDetails;
