import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Plus, Edit, FileText, ArrowLeft } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { Order, User, Customer } from '@/types/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { isAdministrador } from '@/utils/permissionUtils';

interface OrderWithCustomerAndUser extends Order {
  customer: Customer;
  user: User;
}

const OrderList = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [orders, setOrders] = useState<OrderWithCustomerAndUser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('orders')
        .select('*, customer:customers(*), user:users(*)')
        .order('created_at', { ascending: false });

      if (currentUser && !isAdministrador(currentUser.userTypeId)) {
        query = query.eq('user_id', currentUser.id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setOrders(data as OrderWithCustomerAndUser[]);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar pedidos');
      toast.error(err.message || 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      toast.error(err.message || 'Erro ao carregar usuários');
    }
  };

  const handleFilterChange = (name: string, value: any) => {
    if (name === 'status') {
      setStatusFilter(value);
    } else if (name === 'user') {
      setUserFilter(value);
    }

    if (currentUser && !isAdministrador(currentUser.userTypeId)) {
      setUserFilter(currentUser.id);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'invoiced': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchTerm = searchQuery.toLowerCase();
    const matchesSearch =
      order.customer.companyName.toLowerCase().includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesUser = userFilter === 'all' || order.user_id === userFilter;

    return matchesSearch && matchesStatus && matchesUser;
  });

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4 text-gray-500"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
            <p className="text-muted-foreground">
              Acompanhe e gerencie os pedidos dos seus clientes
            </p>
          </div>
        </div>
        <Button 
          className="bg-ferplas-500 hover:bg-ferplas-600"
          onClick={() => navigate('/orders/new')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
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
                placeholder="Buscar pedidos..."
                className="pl-10 input-transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="invoiced">Faturado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            {isAdministrador(currentUser?.userTypeId) && (
              <Select value={userFilter} onValueChange={(value) => handleFilterChange('user', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Usuários</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center p-4">
              Carregando pedidos...
            </div>
          ) : error ? (
            <div className="flex justify-center items-center p-4 text-red-500">
              {error}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber ? `#${order.orderNumber}` : 'Novo'}
                    </TableCell>
                    <TableCell>{order.customer.companyName}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.user.name}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/orders/${order.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {filteredOrders.length > ordersPerPage && (
        <Pagination
          currentPage={currentPage}
          totalCount={filteredOrders.length}
          pageSize={ordersPerPage}
          onPageChange={paginate}
        />
      )}
    </div>
  );
};

export default OrderList;
