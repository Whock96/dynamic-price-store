import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, X, Check, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { TransportCompany } from '@/types/types';
import { isAdministrador } from '@/utils/permissionUtils';

interface TransportCompanyFormData {
  name: string;
  document: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
}

const TransportCompanyManagement = () => {
  const { user } = useAuth();
  const canManageTransportCompanies = user && isAdministrador(user.userTypeId);

  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TransportCompanyFormData>({
    name: '',
    document: '',
    email: '',
    phone: '',
    whatsapp: '',
  });
  const [selectedCompany, setSelectedCompany] = useState<TransportCompany | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchTransportCompanies();
  }, []);

  const fetchTransportCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transport_companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setTransportCompanies(data || []);
    } catch (error) {
      console.error('Error fetching transport companies:', error);
      toast.error('Erro ao carregar transportadoras');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openDialog = () => {
    setIsDialogOpen(true);
    setFormData({ name: '', document: '', email: '', phone: '', whatsapp: '' });
    setIsEditing(false);
    setSelectedCompany(null);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setSelectedCompany(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.document) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    try {
      if (isEditing && selectedCompany) {
        const { error } = await supabase
          .from('transport_companies')
          .update(formData)
          .eq('id', selectedCompany.id);

        if (error) throw error;
        toast.success('Transportadora atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('transport_companies')
          .insert([{ ...formData, id:  selectedCompany?.id || uuidv4() }]);

        if (error) throw error;
        toast.success('Transportadora criada com sucesso!');
      }

      fetchTransportCompanies();
      closeDialog();
    } catch (error) {
      console.error('Error creating/updating transport company:', error);
      toast.error('Erro ao criar/atualizar transportadora');
    }
  };

  const handleEdit = (company: TransportCompany) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      document: company.document,
      email: company.email || '',
      phone: company.phone || '',
      whatsapp: company.whatsapp || '',
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCompanyToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;

    try {
      const { error } = await supabase
        .from('transport_companies')
        .delete()
        .eq('id', companyToDelete);

      if (error) throw error;
      toast.success('Transportadora excluída com sucesso!');
      fetchTransportCompanies();
    } catch (error) {
      console.error('Error deleting transport company:', error);
      toast.error('Erro ao excluir transportadora');
    } finally {
      setIsDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setCompanyToDelete(null);
  };

  if (!canManageTransportCompanies) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Você não tem permissão para gerenciar transportadoras.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Transportadoras</h1>
        <Button onClick={openDialog} className="bg-ferplas-500 hover:bg-ferplas-600">
          <Plus className="mr-2 h-4 w-4" /> Adicionar Transportadora
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Transportadoras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transportCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.document}</TableCell>
                    <TableCell>{company.email || '—'}</TableCell>
                    <TableCell>{company.phone || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(company.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {transportCompanies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">Nenhuma transportadora encontrada.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Transportadora' : 'Criar Transportadora'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Edite os campos abaixo para atualizar a transportadora.' : 'Adicione uma nova transportadora preenchendo os campos abaixo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="document" className="text-right">
                CNPJ
              </Label>
              <Input type="text" id="document" name="document" value={formData.document} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input type="email" id="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Telefone
              </Label>
              <Input type="text" id="phone" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="whatsapp" className="text-right">
                WhatsApp
              </Label>
              <Input type="text" id="whatsapp" name="whatsapp" value={formData.whatsapp || ''} onChange={handleInputChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleSubmit} className="bg-ferplas-500 hover:bg-ferplas-600">
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir esta transportadora? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransportCompanyManagement;
