import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Percent, Plus, Edit, Trash2, ArrowLeft, Save,
  DollarSign, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { DiscountOption } from '@/types/types';

// Mock data para opções de desconto, agora sem a opção "A Vista"
const INITIAL_DISCOUNTS: DiscountOption[] = [
  {
    id: '1',
    name: 'Retirada',
    description: 'Desconto para retirada na loja',
    value: 1,
    type: 'discount',
    isActive: true,
  },
  {
    id: '2',
    name: 'Meia nota',
    description: 'Desconto para meia nota fiscal',
    value: 3,
    type: 'discount',
    isActive: true,
  },
  {
    id: '3',
    name: 'Substituição tributária',
    description: 'Acréscimo para substituição tributária',
    value: 7.8,
    type: 'surcharge',
    isActive: true,
  },
];

const DiscountManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [discounts, setDiscounts] = useState<DiscountOption[]>(INITIAL_DISCOUNTS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountOption | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    value: 0,
    type: 'discount',
    isActive: true,
  });

  // Verificar se o usuário é administrador
  useEffect(() => {
    if (user?.role !== 'administrator') {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleOpenDialog = (discount?: DiscountOption) => {
    if (discount) {
      setIsEditMode(true);
      setSelectedDiscount(discount);
      setFormData({
        id: discount.id,
        name: discount.name,
        description: discount.description,
        value: discount.value,
        type: discount.type,
        isActive: discount.isActive,
      });
    } else {
      setIsEditMode(false);
      setSelectedDiscount(null);
      setFormData({
        id: `discount-${Date.now()}`,
        name: '',
        description: '',
        value: 0,
        type: 'discount',
        isActive: true,
      });
    }
    
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'value' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleToggleActive = (discountId: string) => {
    setDiscounts(prev => prev.map(discount => 
      discount.id === discountId 
        ? { ...discount, isActive: !discount.isActive } 
        : discount
    ));
    
    const discount = discounts.find(d => d.id === discountId);
    if (discount) {
      const action = discount.isActive ? 'desativado' : 'ativado';
      toast.success(`Desconto "${discount.name}" ${action} com sucesso`);
    }
  };

  const handleSaveDiscount = () => {
    // Validação básica
    if (!formData.name || formData.value <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (isEditMode) {
      // Atualizar desconto existente
      setDiscounts(prev => prev.map(discount => discount.id === formData.id ? {
        ...discount,
        name: formData.name,
        description: formData.description,
        value: formData.value,
        type: formData.type as 'discount' | 'surcharge',
        isActive: formData.isActive,
      } : discount));
      toast.success(`Desconto "${formData.name}" atualizado com sucesso`);
    } else {
      // Adicionar novo desconto
      const newDiscount: DiscountOption = {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        value: formData.value,
        type: formData.type as 'discount' | 'surcharge',
        isActive: formData.isActive,
      };
      
      setDiscounts(prev => [...prev, newDiscount]);
      toast.success(`Desconto "${formData.name}" adicionado com sucesso`);
    }
    
    handleCloseDialog();
  };

  const handleDeleteDiscount = (discountId: string) => {
    setDiscounts(prev => prev.filter(discount => discount.id !== discountId));
    toast.success('Desconto removido com sucesso');
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Descontos</h1>
            <p className="text-muted-foreground">
              Configure as opções de desconto disponíveis no carrinho
            </p>
          </div>
        </div>
        <Button 
          className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Desconto
        </Button>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Opções de Desconto Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map(discount => (
                <TableRow key={discount.id}>
                  <TableCell className="font-medium">{discount.name}</TableCell>
                  <TableCell>{discount.description}</TableCell>
                  <TableCell>{discount.value}%</TableCell>
                  <TableCell>
                    {discount.type === 'discount' ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">Desconto</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">Acréscimo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={discount.isActive}
                      onCheckedChange={() => handleToggleActive(discount.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 px-2 text-amber-600"
                      onClick={() => handleOpenDialog(discount)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2 text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover desconto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação irá remover permanentemente o desconto "{discount.name}" do sistema. 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleDeleteDiscount(discount.id)}
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {discounts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Percent className="h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-600">Nenhum desconto encontrado</h2>
              <p className="text-gray-500 mt-1">Adicione uma nova opção de desconto para começar.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Instruções</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            As opções de desconto configuradas aqui estarão disponíveis para seleção no carrinho durante o processo de pedido.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-md border border-green-100">
              <div className="flex items-center mb-2">
                <Percent className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-medium text-green-800">Descontos</h3>
              </div>
              <p className="text-sm text-green-700">
                Reduzem o valor final do pedido. São exibidos com um sinal de menos (-) no carrinho.
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
              <div className="flex items-center mb-2">
                <CreditCard className="h-5 w-5 text-amber-600 mr-2" />
                <h3 className="font-medium text-amber-800">Acréscimos</h3>
              </div>
              <p className="text-sm text-amber-700">
                Aumentam o valor final do pedido. São exibidos com um sinal de mais (+) no carrinho.
              </p>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-medium text-blue-800">Cálculo</h3>
            </div>
            <p className="text-sm text-blue-700">
              Os descontos e acréscimos são calculados cumulativamente sobre o preço unitário dos produtos, 
              junto com o desconto padrão do cliente e os descontos individuais de cada item.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para adicionar/editar desconto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Editar Opção' : 'Nova Opção'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Atualize os detalhes da opção de desconto ou acréscimo.' 
                : 'Configure uma nova opção de desconto ou acréscimo.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome*</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Pagamento à Vista"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Ex: Desconto para pagamentos à vista"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Valor (%)*</Label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.value}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <Label htmlFor="type">Tipo*</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Desconto</SelectItem>
                    <SelectItem value="surcharge">Acréscimo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Ativo</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleSwitchChange('isActive', checked)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDiscount} className="bg-ferplas-500 hover:bg-ferplas-600">
              <Save className="mr-2 h-4 w-4" />
              {isEditMode ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscountManagement;
