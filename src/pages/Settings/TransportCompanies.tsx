
import React, { useState } from 'react';
import { useTransportCompanies } from '@/context/TransportCompanyContext';
import { TransportCompany } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Truck, Edit, Trash2, Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { formatCnpj } from '@/utils/formatters';

const TransportCompanies = () => {
  const { 
    transportCompanies,
    isLoading,
    addTransportCompany,
    updateTransportCompany,
    deleteTransportCompany
  } = useTransportCompanies();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransportCompany, setSelectedTransportCompany] = useState<TransportCompany | null>(null);
  
  // Form state for adding/editing
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    whatsapp: '',
  });

  const filteredTransportCompanies = transportCompanies.filter(tc => 
    tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tc.document.includes(searchQuery)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      document: '',
      email: '',
      phone: '',
      whatsapp: '',
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.document) {
      toast.error('Nome e CNPJ são campos obrigatórios');
      return;
    }
    
    try {
      await addTransportCompany(formData);
      toast.success('Transportadora adicionada com sucesso');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding transport company:', error);
      toast.error('Erro ao adicionar transportadora');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTransportCompany) return;
    
    if (!formData.name || !formData.document) {
      toast.error('Nome e CNPJ são campos obrigatórios');
      return;
    }
    
    try {
      await updateTransportCompany(selectedTransportCompany.id, formData);
      toast.success('Transportadora atualizada com sucesso');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating transport company:', error);
      toast.error('Erro ao atualizar transportadora');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTransportCompany) return;
    
    try {
      await deleteTransportCompany(selectedTransportCompany.id);
      toast.success('Transportadora excluída com sucesso');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting transport company:', error);
      toast.error('Erro ao excluir transportadora');
    }
  };

  const openEditDialog = (transportCompany: TransportCompany) => {
    setSelectedTransportCompany(transportCompany);
    setFormData({
      name: transportCompany.name,
      document: transportCompany.document,
      email: transportCompany.email || '',
      phone: transportCompany.phone || '',
      whatsapp: transportCompany.whatsapp || '',
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (transportCompany: TransportCompany) => {
    setSelectedTransportCompany(transportCompany);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (transportCompany: TransportCompany) => {
    setSelectedTransportCompany(transportCompany);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciar Transportadoras</h1>
        <p className="text-muted-foreground">
          Adicione, edite ou remova transportadoras utilizadas nos pedidos
        </p>
      </header>

      <div className="flex justify-between">
        <div className="relative flex-1 max-w-sm">
          <Input 
            placeholder="Buscar transportadoras..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-ferplas-500 hover:bg-ferplas-600">
              <Plus className="mr-2 h-4 w-4" />
              Nova Transportadora
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Transportadora</DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para adicionar uma nova transportadora
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-right">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Nome da transportadora"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="document" className="text-right">
                    CNPJ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="document"
                    name="document"
                    placeholder="00.000.000/0000-00"
                    value={formData.document}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-right">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="(00) 0000-0000"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-right">
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    placeholder="(00) 00000-0000"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-ferplas-500 hover:bg-ferplas-600">
                  Adicionar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transportadoras Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-ferplas-500 rounded-full border-t-transparent"></div>
            </div>
          ) : filteredTransportCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhuma transportadora encontrada</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery ? 'Tente usar outros termos de busca' : 'Clique no botão "Nova Transportadora" para adicionar'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                  {filteredTransportCompanies.map((transportCompany) => (
                    <TableRow key={transportCompany.id}>
                      <TableCell className="font-medium">{transportCompany.name}</TableCell>
                      <TableCell>{formatCnpj(transportCompany.document)}</TableCell>
                      <TableCell>{transportCompany.email || '-'}</TableCell>
                      <TableCell>{transportCompany.phone || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewDialog(transportCompany)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(transportCompany)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(transportCompany)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Transportadora</DialogTitle>
          </DialogHeader>
          
          {selectedTransportCompany && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Nome:</p>
                  <p className="text-base">{selectedTransportCompany.name}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">CNPJ:</p>
                  <p className="text-base">{formatCnpj(selectedTransportCompany.document)}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Email:</p>
                  <p className="text-base">{selectedTransportCompany.email || '-'}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Telefone:</p>
                  <p className="text-base">{selectedTransportCompany.phone || '-'}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">WhatsApp:</p>
                  <p className="text-base">{selectedTransportCompany.whatsapp || '-'}</p>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Transportadora</DialogTitle>
            <DialogDescription>
              Edite as informações da transportadora
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-right">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  placeholder="Nome da transportadora"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-document" className="text-right">
                  CNPJ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-document"
                  name="document"
                  placeholder="00.000.000/0000-00"
                  value={formData.document}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-right">
                  Telefone
                </Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  placeholder="(00) 0000-0000"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-whatsapp" className="text-right">
                  WhatsApp
                </Label>
                <Input
                  id="edit-whatsapp"
                  name="whatsapp"
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-ferplas-500 hover:bg-ferplas-600">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transportadora</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transportadora? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransportCompanies;
