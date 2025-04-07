
import React, { useState } from 'react';
import { useTransportCompanies } from '@/context/TransportCompanyContext';
import { Plus, Edit, Trash2, MoreHorizontal, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Label } from '@/components/ui/label';
import { TransportCompany } from '@/types/types';
import { toast } from 'sonner';

const TransportCompanyForm = ({ 
  onSubmit, 
  initialData = null,
  onCancel
}: { 
  onSubmit: (data: Omit<TransportCompany, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: TransportCompany | null;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Omit<TransportCompany, 'id' | 'createdAt' | 'updatedAt'>>({
    name: initialData?.name || '',
    document: initialData?.document || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    whatsapp: initialData?.whatsapp || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nome da transportadora é obrigatório');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input 
            id="name" 
            name="name"
            value={formData.name} 
            onChange={handleChange} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="document">CNPJ</Label>
          <Input 
            id="document" 
            name="document"
            value={formData.document} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email"
            type="email"
            value={formData.email} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input 
            id="phone" 
            name="phone"
            value={formData.phone} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input 
            id="whatsapp" 
            name="whatsapp"
            value={formData.whatsapp} 
            onChange={handleChange} 
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const TransportCompanyDetail = ({ 
  company,
  onClose
}: { 
  company: TransportCompany;
  onClose: () => void;
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <h3 className="font-medium text-sm text-gray-500">Nome</h3>
          <p>{company.name}</p>
        </div>
        
        {company.document && (
          <div>
            <h3 className="font-medium text-sm text-gray-500">CNPJ</h3>
            <p>{company.document}</p>
          </div>
        )}
        
        {company.email && (
          <div>
            <h3 className="font-medium text-sm text-gray-500">Email</h3>
            <p>{company.email}</p>
          </div>
        )}
        
        {company.phone && (
          <div>
            <h3 className="font-medium text-sm text-gray-500">Telefone</h3>
            <p>{company.phone}</p>
          </div>
        )}
        
        {company.whatsapp && (
          <div>
            <h3 className="font-medium text-sm text-gray-500">WhatsApp</h3>
            <p>{company.whatsapp}</p>
          </div>
        )}
        
        <div>
          <h3 className="font-medium text-sm text-gray-500">Data de Cadastro</h3>
          <p>{company.createdAt.toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
      
      <DialogFooter>
        <Button onClick={onClose}>
          Fechar
        </Button>
      </DialogFooter>
    </div>
  );
};

const TransportCompanies = () => {
  const { transportCompanies, isLoading, addTransportCompany, updateTransportCompany, deleteTransportCompany } = useTransportCompanies();
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<TransportCompany | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const filteredCompanies = transportCompanies.filter(company => 
    company.name.toLowerCase().includes(search.toLowerCase()) || 
    company.document.toLowerCase().includes(search.toLowerCase())
  );
  
  const handleAddSubmit = async (data: Omit<TransportCompany, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCompany = await addTransportCompany(data);
      if (newCompany) {
        toast.success('Transportadora adicionada com sucesso!');
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error('Error adding transport company:', error);
      toast.error('Erro ao adicionar transportadora');
    }
  };
  
  const handleEditSubmit = async (data: Omit<TransportCompany, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedCompany) return;
    
    try {
      const updatedCompany = await updateTransportCompany(selectedCompany.id, data);
      if (updatedCompany) {
        toast.success('Transportadora atualizada com sucesso!');
        setIsEditDialogOpen(false);
        setSelectedCompany(null);
      }
    } catch (error) {
      console.error('Error updating transport company:', error);
      toast.error('Erro ao atualizar transportadora');
    }
  };
  
  const handleDelete = async () => {
    if (!selectedCompany) return;
    
    try {
      const success = await deleteTransportCompany(selectedCompany.id);
      if (success) {
        toast.success('Transportadora excluída com sucesso!');
        setIsDeleteDialogOpen(false);
        setSelectedCompany(null);
      }
    } catch (error) {
      console.error('Error deleting transport company:', error);
      toast.error('Erro ao excluir transportadora');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transportadoras</h1>
          <p className="text-muted-foreground">
            Gerencie as transportadoras para seus pedidos
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-ferplas-500 hover:bg-ferplas-600">
              <Plus className="mr-2 h-4 w-4" />
              Nova Transportadora
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nova Transportadora</DialogTitle>
              <DialogDescription>
                Preencha os dados para cadastrar uma nova transportadora.
              </DialogDescription>
            </DialogHeader>
            <TransportCompanyForm 
              onSubmit={handleAddSubmit} 
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar transportadoras..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ferplas-500"></div>
        </div>
      ) : filteredCompanies.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.document}</TableCell>
                  <TableCell>{company.phone}</TableCell>
                  <TableCell>{company.email}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCompany(company);
                            setIsDetailDialogOpen(true);
                          }}
                        >
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCompany(company);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedCompany(company);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border rounded-md">
          <p className="text-muted-foreground mb-4">Nenhuma transportadora encontrada.</p>
          <Button 
            className="bg-ferplas-500 hover:bg-ferplas-600"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Transportadora
          </Button>
        </div>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Transportadora</DialogTitle>
            <DialogDescription>
              Altere os dados da transportadora.
            </DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <TransportCompanyForm 
              initialData={selectedCompany} 
              onSubmit={handleEditSubmit} 
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Transportadora</DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <TransportCompanyDetail 
              company={selectedCompany} 
              onClose={() => setIsDetailDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transportadora</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a transportadora "{selectedCompany?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
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
