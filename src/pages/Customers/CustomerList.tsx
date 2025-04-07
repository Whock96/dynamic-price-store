
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useCustomers } from '@/context/CustomerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatPhoneNumber, formatDocument } from '@/utils/formatters';
import SortableHeader from '@/components/ui/sortable-header';

type SortDirection = 'asc' | 'desc' | null;

const CustomerList = () => {
  const navigate = useNavigate();
  const { customers, isLoading, deleteCustomer } = useCustomers();
  const [filteredCustomers, setFilteredCustomers] = useState(customers);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  // Sorting states
  const [sortKey, setSortKey] = useState<string | null>('companyName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    if (searchTerm.trim() === '') {
      // Apply sorting without filtering
      const sortedCustomers = [...customers];
      
      if (sortKey && sortDirection) {
        sortCustomers(sortedCustomers);
      }
      
      setFilteredCustomers(sortedCustomers);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = customers.filter(
        customer =>
          customer.companyName.toLowerCase().includes(lowerCaseSearchTerm) ||
          (customer.document && customer.document.toLowerCase().includes(lowerCaseSearchTerm))
      );
      
      // Apply sorting to filtered results
      if (sortKey && sortDirection) {
        sortCustomers(filtered);
      }
      
      setFilteredCustomers(filtered);
    }
  }, [customers, searchTerm, sortKey, sortDirection]);

  const sortCustomers = (customersToSort: typeof customers) => {
    customersToSort.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortKey) {
        case 'companyName':
          aValue = a.companyName;
          bValue = b.companyName;
          break;
        case 'document':
          aValue = a.document || '';
          bValue = b.document || '';
          break;
        case 'city':
          aValue = a.city || '';
          bValue = b.city || '';
          break;
        case 'state':
          aValue = a.state || '';
          bValue = b.state || '';
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        default:
          aValue = a[sortKey as keyof typeof a] || '';
          bValue = b[sortKey as keyof typeof b] || '';
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
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      // If already sorting by this key, toggle direction or reset
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === null) {
        setSortKey(null);
      }
    } else {
      // If sorting by a new key, start with ascending
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleConfirmDelete = (id: string) => {
    setConfirmDeleteId(id);
    setIsConfirmDialogOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!confirmDeleteId) return;

    try {
      await deleteCustomer(confirmDeleteId);
      toast.success('Cliente excluído com sucesso');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Erro ao excluir cliente');
    } finally {
      setIsConfirmDialogOpen(false);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Button onClick={() => navigate('/customers/new')} className="bg-ferplas-500 hover:bg-ferplas-600">
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Clientes</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
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
                    <TableHead>
                      <SortableHeader
                        label="Nome"
                        sortKey="companyName"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        label="CNPJ"
                        sortKey="document"
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
                        label="Telefone"
                        sortKey="phone"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                      />
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.companyName}</TableCell>
                        <TableCell>{customer.document ? formatDocument(customer.document) : '—'}</TableCell>
                        <TableCell>{customer.city || '—'}</TableCell>
                        <TableCell>{customer.state || '—'}</TableCell>
                        <TableCell>{customer.phone ? formatPhoneNumber(customer.phone) : '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => navigate(`/customers/${customer.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleConfirmDelete(customer.id)}
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
                        Nenhum cliente encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomerList;
