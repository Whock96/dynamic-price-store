import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TransportCompanyForm from '@/components/settings/TransportCompanyForm';
import { TransportCompany } from '@/types/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/AuthContext';
import { isAdministrador } from '@/utils/permissionUtils';

const TransportCompanyManagement = () => {
  const { user } = useAuth();
  const isAdmin = user && isAdministrador(user.userTypeId);
  
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<TransportCompany | null>(null);
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransportCompanies();
  }, []);

  const fetchTransportCompanies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transport_companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setTransportCompanies(data as TransportCompany[]);
      }
    } catch (error) {
      console.error('Error fetching transport companies:', error);
      toast.error('Erro ao carregar transportadoras');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCompany(null);
    setOpenCreateForm(true);
  };

  const handleEdit = (company: TransportCompany) => {
    setSelectedCompany(company);
    setOpenEditForm(true);
  };

  const handleDelete = (company: TransportCompany) => {
    setSelectedCompany(company);
    setOpenDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (!selectedCompany) return;

    try {
      const { error } = await supabase
        .from('transport_companies')
        .delete()
        .eq('id', selectedCompany.id);

      if (error) {
        throw error;
      }

      setTransportCompanies(transportCompanies.filter(tc => tc.id !== selectedCompany.id));
      toast.success('Transportadora excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting transport company:', error);
      toast.error('Erro ao excluir transportadora');
    } finally {
      setOpenDeleteAlert(false);
      setSelectedCompany(null);
    }
  };

  const filteredCompanies = transportCompanies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.document.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transportadoras</h1>
          <p className="text-muted-foreground">
            Gerencie as transportadoras do sistema
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-ferplas-500 hover:bg-ferplas-600">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Transportadoras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Buscar por nome ou CNPJ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CNPJ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">Carregando...</td>
                  </tr>
                ) : filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">Nenhuma transportadora encontrada.</td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <tr key={company.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.document}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.email ? `${company.email} / ` : ''}
                        {company.phone || 'Telefone não informado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(company)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(company)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openCreateForm} onOpenChange={setOpenCreateForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Transportadora</DialogTitle>
          </DialogHeader>
          <TransportCompanyForm
            onClose={() => setOpenCreateForm(false)}
            onSuccess={fetchTransportCompanies}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openEditForm} onOpenChange={setOpenEditForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transportadora</DialogTitle>
          </DialogHeader>
          <TransportCompanyForm
            company={selectedCompany}
            onClose={() => setOpenEditForm(false)}
            onSuccess={fetchTransportCompanies}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={openDeleteAlert} onOpenChange={setOpenDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a transportadora <strong>{selectedCompany?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenDeleteAlert(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransportCompanyManagement;
