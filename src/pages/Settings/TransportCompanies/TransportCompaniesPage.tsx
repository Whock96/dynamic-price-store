
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useTransportCompanies } from '@/context/TransportCompanyContext';
import { formatDocument, formatPhoneNumber } from '@/utils/formatters';

const TransportCompaniesPage = () => {
  const navigate = useNavigate();
  const { transportCompanies, isLoading, deleteTransportCompany } = useTransportCompanies();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredCompanies = transportCompanies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.document.includes(searchTerm)
  );

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const success = await deleteTransportCompany(id);
      if (success) {
        toast.success('Transportadora excluída com sucesso');
      } else {
        toast.error('Erro ao excluir transportadora');
      }
    } catch (error) {
      console.error('Error deleting transport company:', error);
      toast.error('Erro ao excluir transportadora');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => navigate('/settings')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Gerenciar Transportadoras</h1>
      </div>
      
      <div className="flex justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transportadoras..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          className="bg-ferplas-500 hover:bg-ferplas-600" 
          onClick={() => navigate('/settings/transport-companies/new')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Transportadora
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Transportadoras</CardTitle>
          <CardDescription>
            Gerenciamento de transportadoras utilizadas para entregas de pedidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-ferplas-500 border-t-transparent" />
            </div>
          ) : filteredCompanies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{formatDocument(company.document)}</TableCell>
                    <TableCell>{formatPhoneNumber(company.phone)}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/settings/transport-companies/${company.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Transportadora</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a transportadora "{company.name}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDelete(company.id)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : 'Excluir'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhuma transportadora encontrada.</p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/settings/transport-companies/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Transportadora
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransportCompaniesPage;
