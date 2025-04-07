
import React, { useState } from 'react';
import { useTransportCompanies } from '@/context/TransportCompanyContext';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
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
} from "@/components/ui/dialog";
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
import { toast } from 'sonner';
import { formatDocument, formatPhoneNumber } from '@/utils/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const TransportCompanyManagement = () => {
  const { companies, isLoading, addCompany, updateCompany, deleteCompany, getCompanyById } = useTransportCompanies();
  const { user, hasPermission } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    whatsapp: '',
  });
  
  const resetForm = () => {
    setFormData({
      name: '',
      document: '',
      phone: '',
      email: '',
      whatsapp: '',
    });
    setSelectedCompany(null);
  };
  
  const handleOpenForm = (id?: string) => {
    if (id) {
      const company = getCompanyById(id);
      if (company) {
        setFormData({
          name: company.name,
          document: company.document,
          phone: company.phone || '',
          email: company.email || '',
          whatsapp: company.whatsapp || '',
        });
        setSelectedCompany(id);
      }
    } else {
      resetForm();
    }
    
    setIsFormOpen(true);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.document.trim()) {
      toast.error('Nome e CNPJ são campos obrigatórios');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      if (selectedCompany) {
        // Update existing
        await updateCompany(selectedCompany, formData);
      } else {
        // Create new
        await addCompany(formData);
      }
      
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving transport company:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    setIsProcessing(true);
    try {
      await deleteCompany(id);
    } catch (error) {
      console.error('Error deleting transport company:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleOpenView = (id: string) => {
    setSelectedCompany(id);
    setIsViewOpen(true);
  };
  
  const filteredCompanies = companies.filter(
    company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.document.includes(searchTerm) ||
      (company.email && company.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const selectedCompanyDetails = selectedCompany ? getCompanyById(selectedCompany) : null;
  
  if (!user) return null;
  
  // Check permission
  if (!hasPermission('settings_manage')) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <h2 className="text-2xl font-semibold text-gray-800">Acesso Restrito</h2>
        <p className="mt-2 text-gray-600">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Transportadoras</h1>
          <p className="text-muted-foreground">
            Adicione, edite ou remova transportadoras utilizadas pela empresa.
          </p>
        </div>
        
        <Button
          onClick={() => handleOpenForm()}
          className="bg-ferplas-500 hover:bg-ferplas-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Transportadora
        </Button>
      </header>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Transportadoras</CardTitle>
          <CardDescription>
            Lista de todas as transportadoras cadastradas.
          </CardDescription>
          
          <div className="flex mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nome, CNPJ ou email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-ferplas-500" />
              <span className="ml-2 text-lg text-muted-foreground">Carregando transportadoras...</span>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhuma transportadora encontrada para esta busca.' : 'Nenhuma transportadora cadastrada.'}
              </p>
              {searchTerm && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                      <TableCell>{company.email || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenView(company.id)}
                            className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenForm(company.id)}
                            className="h-8 w-8 text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a transportadora "{company.name}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(company.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Excluindo...
                                    </>
                                  ) : (
                                    'Excluir'
                                  )}
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
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? 'Editar Transportadora' : 'Nova Transportadora'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações da transportadora abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Transportadora <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="document">CNPJ <span className="text-red-500">*</span></Label>
                  <Input
                    id="document"
                    name="document"
                    value={formData.document}
                    onChange={handleChange}
                    required
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
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="bg-ferplas-500 hover:bg-ferplas-600"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Transportadora</DialogTitle>
          </DialogHeader>
          
          {selectedCompanyDetails && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nome</p>
                  <p className="text-base">{selectedCompanyDetails.name}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">CNPJ</p>
                  <p className="text-base">{formatDocument(selectedCompanyDetails.document)}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Telefone</p>
                  <p className="text-base">
                    {selectedCompanyDetails.phone 
                      ? formatPhoneNumber(selectedCompanyDetails.phone) 
                      : '-'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">WhatsApp</p>
                  <p className="text-base">
                    {selectedCompanyDetails.whatsapp 
                      ? formatPhoneNumber(selectedCompanyDetails.whatsapp) 
                      : '-'}
                  </p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base">{selectedCompanyDetails.email || '-'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Data de Cadastro</p>
                  <p className="text-base">
                    {new Intl.DateTimeFormat('pt-BR').format(selectedCompanyDetails.createdAt)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Última Atualização</p>
                  <p className="text-base">
                    {new Intl.DateTimeFormat('pt-BR').format(selectedCompanyDetails.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsViewOpen(false)}
            >
              Fechar
            </Button>
            
            <Button 
              onClick={() => {
                setIsViewOpen(false);
                if (selectedCompany) {
                  handleOpenForm(selectedCompany);
                }
              }}
              className="bg-ferplas-500 hover:bg-ferplas-600"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransportCompanyManagement;
