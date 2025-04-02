
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Users, UserPlus, Trash2 } from 'lucide-react';
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
import { useCustomers } from '@/context/CustomerContext';
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
} from "@/components/ui/alert-dialog";

// Mock data for salespeople
const MOCK_SALESPEOPLE = [
  { id: '1', name: 'João Silva' },
  { id: '2', name: 'Maria Oliveira' },
  { id: '3', name: 'Carlos Santos' },
];

const CustomerList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [salesPersonFilter, setSalesPersonFilter] = useState('all');
  const { customers, isLoading, deleteCustomer, refreshCustomers } = useCustomers();

  useEffect(() => {
    // Refresh customers when component mounts
    refreshCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.document.includes(searchQuery);
    const matchesCity = cityFilter === 'all' || customer.city === cityFilter;
    const matchesSalesPerson = salesPersonFilter === 'all' || customer.salesPersonId === salesPersonFilter;
    
    return matchesSearch && matchesCity && matchesSalesPerson;
  });

  const uniqueCities = Array.from(new Set(customers.map(c => c.city))).sort();

  const getSalesPersonName = (id: string) => {
    const salesPerson = MOCK_SALESPEOPLE.find(sp => sp.id === id);
    return salesPerson ? salesPerson.name : 'Não atribuído';
  };

  const handleDeleteAllCustomers = async () => {
    try {
      for (const customer of customers) {
        await deleteCustomer(customer.id);
      }
      toast.success('Todos os clientes foram removidos com sucesso');
      refreshCustomers();
    } catch (error) {
      console.error('Error deleting all customers:', error);
      toast.error('Erro ao remover todos os clientes');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerenciamento de clientes da Ferplas.
          </p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                className="bg-red-500 hover:bg-red-600 button-transition"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Clientes
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação vai remover TODOS os clientes cadastrados. Esta operação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDeleteAllCustomers}
                >
                  Remover Todos
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button 
            className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
            onClick={() => navigate('/customers/new')}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </header>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou documento..."
                className="pl-10 input-transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Cidade" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cidades</SelectItem>
                {uniqueCities.map(city => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={salesPersonFilter} onValueChange={setSalesPersonFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Vendedor" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os vendedores</SelectItem>
                {MOCK_SALESPEOPLE.map(salesPerson => (
                  <SelectItem key={salesPerson.id} value={salesPerson.id}>
                    {salesPerson.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full border-4 border-t-ferplas-500 border-r-transparent border-b-ferplas-300 border-l-ferplas-300 animate-spin mb-4" />
              <h2 className="text-xl font-medium text-gray-600">Carregando clientes...</h2>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map(customer => (
                  <TableRow 
                    key={customer.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <TableCell className="font-medium">{customer.companyName}</TableCell>
                    <TableCell>{customer.document}</TableCell>
                    <TableCell>{customer.city}/{customer.state}</TableCell>
                    <TableCell>{getSalesPersonName(customer.salesPersonId)}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2 text-ferplas-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customers/${customer.id}/edit`);
                          }}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cart?customer=${customer.id}`);
                          }}
                        >
                          Novo Pedido
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!isLoading && filteredCustomers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-600">Nenhum cliente encontrado</h2>
              <p className="text-gray-500 mt-1">Tente ajustar seus filtros ou realizar uma nova busca.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerList;
