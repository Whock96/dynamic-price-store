
import React, { useState, useEffect } from 'react';
import { PlusCircle, Truck, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import TransportCompanyDialog from '@/components/transport-companies/TransportCompanyDialog';
import { TransportCompany } from '@/types/types';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/utils/formatters';
import TransportCompanyDetailDialog from '@/components/transport-companies/TransportCompanyDetailDialog';
import { useAuth } from '@/context/AuthContext';
import { isAdministrator } from '@/utils/permissionUtils';
import { useNavigate } from 'react-router-dom';

const TransportCompanyManagement = () => {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<TransportCompany | null>(null);
  
  const {
    data: transportCompanies,
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    error
  } = useSupabaseData<TransportCompany>('transport_companies', {
    orderBy: { column: 'name', ascending: true }
  });

  useEffect(() => {
    // Verificar se houve erro ao carregar os dados
    if (error) {
      console.error("Erro ao carregar transportadoras:", error);
      toast.error(`Erro ao carregar transportadoras: ${error.message}`);
    }
  }, [error]);

  const filteredCompanies = transportCompanies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.document && company.document.includes(searchTerm)) ||
    (company.email && company.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddCompany = (company: Omit<TransportCompany, 'id' | 'created_at' | 'updated_at'>) => {
    createRecord(company)
      .then(() => {
        toast.success('Transportadora cadastrada com sucesso');
        setIsAddDialogOpen(false);
      })
      .catch((error) => {
        toast.error(`Erro ao cadastrar transportadora: ${error.message}`);
      });
  };

  const handleEditCompany = (id: string, company: Partial<TransportCompany>) => {
    updateRecord(id, company)
      .then(() => {
        toast.success('Transportadora atualizada com sucesso');
        setIsEditDialogOpen(false);
        setSelectedCompany(null);
      })
      .catch((error) => {
        toast.error(`Erro ao atualizar transportadora: ${error.message}`);
      });
  };

  const handleDeleteCompany = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transportadora?')) {
      deleteRecord(id)
        .then(() => {
          toast.success('Transportadora excluída com sucesso');
          setSelectedCompany(null);
        })
        .catch((error) => {
          toast.error(`Erro ao excluir transportadora: ${error.message}`);
        });
    }
  };

  const openEditDialog = (company: TransportCompany) => {
    setSelectedCompany(company);
    setIsEditDialogOpen(true);
  };

  const openDetailDialog = (company: TransportCompany) => {
    setSelectedCompany(company);
    setIsDetailDialogOpen(true);
  };

  // Verifica se o usuário tem permissão para gerenciar transportadoras ou é administrador
  const canManageTransportCompanies = user && (isAdministrator(user.role) || hasPermission('transport_companies_manage'));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transportadoras</h2>
          <p className="text-muted-foreground">
            Gerencie as transportadoras utilizadas pela empresa
          </p>
        </div>
        {canManageTransportCompanies && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Transportadora
          </Button>
        )}
      </div>
      
      <Separator />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" /> 
            Transportadoras Cadastradas
          </CardTitle>
          <CardDescription>
            Lista de transportadoras cadastradas no sistema
          </CardDescription>
          <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
            <Input
              type="search"
              placeholder="Buscar por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <Button type="submit" size="icon" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando transportadoras...</div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-4">Nenhuma transportadora encontrada</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.document}</TableCell>
                      <TableCell>{company.email || '-'}</TableCell>
                      <TableCell>{company.phone || '-'}</TableCell>
                      <TableCell>{formatDate(company.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailDialog(company)}
                          >
                            Detalhes
                          </Button>
                          {canManageTransportCompanies && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openEditDialog(company)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteCompany(company.id)}
                              >
                                Excluir
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            Total de transportadoras: {filteredCompanies.length}
          </div>
        </CardFooter>
      </Card>

      {/* Diálogos para adicionar, editar e visualizar transportadoras */}
      <TransportCompanyDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddCompany}
      />

      {selectedCompany && (
        <>
          <TransportCompanyDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSubmit={(data) => handleEditCompany(selectedCompany.id, data)}
            initialData={selectedCompany}
            mode="edit"
          />

          <TransportCompanyDetailDialog
            open={isDetailDialogOpen}
            onOpenChange={setIsDetailDialogOpen}
            company={selectedCompany}
          />
        </>
      )}
    </div>
  );
};

export default TransportCompanyManagement;
