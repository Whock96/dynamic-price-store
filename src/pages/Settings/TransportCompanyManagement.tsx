
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { TransportCompany } from '@/types/types';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/utils/formatters';
import { isAdministrador } from '@/utils/permissionUtils';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

interface TransportCompanyWithDates extends Omit<TransportCompany, 'created_at' | 'updated_at'> {
  created_at: Date;
  updated_at: Date;
}

const TransportCompanyManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<TransportCompanyWithDates[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<TransportCompanyWithDates | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    whatsapp: '',
  });

  const permissions = {
    canCreate: true,
    canEdit: true,
    canDelete: true,
  };

  useEffect(() => {
    if (!currentUser || !isAdministrador(currentUser.userTypeId)) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
      return;
    }
    
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, currentUser]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('transport_companies')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      // Convertendo as strings de data para objetos Date
      const companiesWithDates = data.map(company => ({
        ...company,
        created_at: new Date(company.created_at),
        updated_at: new Date(company.updated_at),
      }));

      setCompanies(companiesWithDates);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar transportadoras');
      toast.error(err.message || 'Erro ao carregar transportadoras');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = async () => {
    try {
      const { data, error } = await supabase
        .from('transport_companies')
        .insert([formData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newCompanyWithDates = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };

      setCompanies(prev => [...prev, newCompanyWithDates]);
      setIsCreateModalOpen(false);
      setFormData({ name: '', document: '', email: '', phone: '', whatsapp: '' });
      toast.success('Transportadora criada com sucesso');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar transportadora');
      toast.error(err.message || 'Erro ao criar transportadora');
    }
  };

  const handleEdit = async () => {
    if (!selectedCompany) return;

    try {
      const { data, error } = await supabase
        .from('transport_companies')
        .update(formData)
        .eq('id', selectedCompany.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedCompanyWithDates = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };

      setCompanies(prev =>
        prev.map(company =>
          company.id === selectedCompany.id ? updatedCompanyWithDates : company
        )
      );
      setIsEditModalOpen(false);
      setFormData({ name: '', document: '', email: '', phone: '', whatsapp: '' });
      toast.success('Transportadora atualizada com sucesso');
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar transportadora');
      toast.error(err.message || 'Erro ao atualizar transportadora');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transportadora?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transport_companies')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setCompanies(prev => prev.filter(company => company.id !== id));
      toast.success('Transportadora excluída com sucesso');
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir transportadora');
      toast.error(err.message || 'Erro ao excluir transportadora');
    }
  };

  const filteredCompanies = companies.filter(company => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      company.name.toLowerCase().includes(searchTerm) ||
      company.document.toLowerCase().includes(searchTerm) ||
      (company.email && company.email.toLowerCase().includes(searchTerm)) ||
      (company.phone && company.phone.toLowerCase().includes(searchTerm))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4 text-gray-500"
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Transportadoras</h1>
            <p className="text-muted-foreground">
              Cadastre e gerencie as empresas transportadoras
            </p>
          </div>
        </div>
        {permissions.canCreate && isAdministrador(currentUser?.userTypeId) && (
          <Button 
            className="bg-ferplas-500 hover:bg-ferplas-600"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Transportadora
          </Button>
        )}
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar transportadoras..."
              className="pl-10 input-transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              Carregando transportadoras...
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-12 text-red-500">
              {error}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map(company => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.document}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>{company.phone}</TableCell>
                    <TableCell>{formatDate(company.created_at)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {permissions.canEdit && isAdministrador(currentUser?.userTypeId) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCompany(company);
                            setFormData({
                              name: company.name,
                              document: company.document,
                              email: company.email || '',
                              phone: company.phone || '',
                              whatsapp: company.whatsapp || '',
                            });
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      )}
                      {permissions.canDelete && isAdministrador(currentUser?.userTypeId) && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(company.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Transportadora</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para criar uma nova transportadora.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="document" className="text-right">
                Documento
              </Label>
              <Input
                type="text"
                id="document"
                name="document"
                value={formData.document}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Telefone
              </Label>
              <Input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="whatsapp" className="text-right">
                WhatsApp
              </Label>
              <Input
                type="text"
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Transportadora</DialogTitle>
            <DialogDescription>
              Edite os campos abaixo para atualizar a transportadora.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="document" className="text-right">
                Documento
              </Label>
              <Input
                type="text"
                id="document"
                name="document"
                value={formData.document}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Telefone
              </Label>
              <Input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="whatsapp" className="text-right">
                WhatsApp
              </Label>
              <Input
                type="text"
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransportCompanyManagement;
