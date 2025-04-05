
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Users, UserPlus } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { adaptUserData } from '@/utils/adapters';
import { User } from '@/types/types';
import { useAuth } from '@/context/AuthContext';

const CustomerList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [salesPersonFilter, setSalesPersonFilter] = useState('all');
  const { customers, isLoading, refreshCustomers } = useCustomers();
  const [salespeople, setSalespeople] = useState<User[]>([]);
  const [isLoadingSalespeople, setIsLoadingSalespeople] = useState(true);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Array<any>>([]);
  const { user } = useAuth();

  // Verificação para identificar se o usuário é do tipo vendedor específico
  const isSalespersonType = user?.userTypeId === 'c5ee0433-3faf-46a4-a516-be7261bfe575';

  useEffect(() => {
    // Fetch salespeople from the database
    const fetchSalespeople = async () => {
      setIsLoadingSalespeople(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*, user_type:user_types(*)')
          .eq('is_active', true);

        if (error) {
          throw error;
        }

        if (data) {
          const formattedUsers = data.map(user => adaptUserData({
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.user_type?.name || 'salesperson',
            email: user.email || '',
            created_at: user.created_at,
            user_type_id: user.user_type_id
          }));
          
          setSalespeople(formattedUsers);
          console.log('Fetched salespeople for customer list:', formattedUsers);
        }
      } catch (error) {
        console.error('Error fetching salespeople:', error);
      } finally {
        setIsLoadingSalespeople(false);
      }
    };

    fetchSalespeople();
    
    // Refresh customers once when component mounts
    if (!hasRefreshed) {
      refreshCustomers();
      setHasRefreshed(true);
    }
  }, [refreshCustomers, hasRefreshed]);

  useEffect(() => {
    // Filter customers based on search, city, and salesperson filters
    // Se o usuário é do tipo vendedor específico (c5ee0433-3faf-46a4-a516-be7261bfe575),
    // aplicamos a filtragem rigorosa
    let filtered = [...customers];
    
    console.log('CustomerList - Filtrando clientes. User:', user);
    console.log('CustomerList - Tipo de usuário do vendedor:', user?.userTypeId);
    console.log('CustomerList - É vendedor específico:', isSalespersonType);
    
    // Verificação mais rigorosa para o tipo específico de vendedor
    if (isSalespersonType && user?.id) {
      console.log('CustomerList - Aplicando filtro rigoroso para vendedor com ID:', user.id);
      
      // Converter para string para garantir comparação consistente
      const currentUserIdStr = String(user.id);
      
      // Filtrar para mostrar apenas clientes atribuídos a este vendedor
      filtered = filtered.filter(customer => {
        const customerSalesPersonIdStr = String(customer.salesPersonId);
        const matches = customerSalesPersonIdStr === currentUserIdStr;
        
        console.log(`CustomerList - Comparando cliente ${customer.companyName}: ID do vendedor ${customerSalesPersonIdStr} vs ID do usuário atual ${currentUserIdStr} = ${matches}`);
        
        return matches;
      });
      
      console.log(`CustomerList - Após filtragem rigorosa: ${filtered.length} de ${customers.length} clientes`);
    } 
    // Verificação padrão para usuários com role = salesperson (mantida para compatibilidade)
    else if (user?.role === 'salesperson' && user?.id) {
      console.log('CustomerList - Aplicando filtro padrão para vendedor (role):', user.id);
      
      // Filter to only show customers assigned to this salesperson
      filtered = filtered.filter(customer => {
        const matches = customer.salesPersonId === user.id;
        return matches;
      });
    }
    
    // Apply other filters
    filtered = filtered.filter(customer => {
      const matchesSearch = customer.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           customer.document.includes(searchQuery);
      const matchesCity = cityFilter === 'all' || customer.city === cityFilter;
      const matchesSalesPerson = salesPersonFilter === 'all' || customer.salesPersonId === salesPersonFilter;
      
      return matchesSearch && matchesCity && matchesSalesPerson;
    });
    
    setFilteredCustomers(filtered);
  }, [customers, searchQuery, cityFilter, salesPersonFilter, user, isSalespersonType]);

  const uniqueCities = Array.from(new Set(customers.map(c => c.city))).sort();

  const getSalesPersonName = (id: string) => {
    const salesPerson = salespeople.find(sp => sp.id === id);
    return salesPerson ? salesPerson.name : 'Não atribuído';
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
            <Select 
              value={salesPersonFilter} 
              onValueChange={setSalesPersonFilter}
              disabled={user?.role === 'salesperson'}
            >
              <SelectTrigger>
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Vendedor" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os vendedores</SelectItem>
                {!isLoadingSalespeople && salespeople.map(salesPerson => (
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
