import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
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

// Fake data for Brazilian states
const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' },
];

// Mock data for salespeople
const MOCK_SALESPEOPLE = [
  { id: '1', name: 'João Silva' },
  { id: '2', name: 'Maria Oliveira' },
  { id: '3', name: 'Carlos Santos' },
];

// Empty customer data
const EMPTY_CUSTOMER = {
  id: '',
  companyName: '',
  document: '',
  salesPersonId: '',
  street: '',
  number: '',
  noNumber: false,
  complement: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  email: '',
  defaultDiscount: 0,
  maxDiscount: 15, // Default maximum discount of 15%
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Get customer by id (mocked)
const getCustomerById = (id: string) => ({
  id,
  companyName: `Cliente ${id.split('-')[1]} Ltda.`,
  document: Math.random().toString().slice(2, 13),
  salesPersonId: '1',
  street: `Rua ${id.split('-')[1]}`,
  number: `${parseInt(id.split('-')[1]) * 10 + 100}`,
  noNumber: false,
  complement: `Sala ${id.split('-')[1]}`,
  city: 'São Paulo',
  state: 'SP',
  zipCode: `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 900) + 100}`,
  phone: `(11) ${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000) + 1000}`,
  email: `cliente${id.split('-')[1]}@example.com`,
  defaultDiscount: Math.floor(Math.random() * 10),
  maxDiscount: Math.floor(Math.random() * 15) + 10, // Random max discount between 10-25%
  createdAt: new Date(),
  updatedAt: new Date(),
});

const CustomerForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== undefined && id !== 'new';

  const [formData, setFormData] = useState(EMPTY_CUSTOMER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode && id) {
      const customerData = getCustomerById(id);
      setFormData(customerData);
    }
  }, [id, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNoNumberChange = (checked: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      noNumber: checked,
      number: checked ? 'S/N' : ''
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      errors.companyName = 'Razão Social é obrigatória';
    }

    if (!formData.document.trim()) {
      errors.document = 'CNPJ/CPF é obrigatório';
    }

    if (!formData.salesPersonId) {
      errors.salesPersonId = 'Vendedor é obrigatório';
    }

    if (!formData.street.trim()) {
      errors.street = 'Rua é obrigatória';
    }

    if (!formData.noNumber && !formData.number.trim()) {
      errors.number = 'Número é obrigatório';
    }

    if (!formData.city.trim()) {
      errors.city = 'Cidade é obrigatória';
    }

    if (!formData.state) {
      errors.state = 'Estado é obrigatório';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (formData.maxDiscount < formData.defaultDiscount) {
      errors.maxDiscount = 'Desconto máximo deve ser maior ou igual ao desconto padrão';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário antes de continuar');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Cliente ${isEditMode ? 'atualizado' : 'cadastrado'} com sucesso`);
      navigate('/customers');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(`Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} cliente`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Cliente removido com sucesso');
      navigate('/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Erro ao remover cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4 text-gray-500"
            onClick={() => navigate('/customers')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditMode ? 'Editar Cliente' : 'Novo Cliente'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode 
                ? 'Atualize as informações do cliente' 
                : 'Preencha os dados para cadastrar um novo cliente'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditMode && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={isSubmitting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente e todos os seus dados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleDelete}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button 
            type="submit"
            form="customer-form"
            className="bg-ferplas-500 hover:bg-ferplas-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </header>

      <form id="customer-form" onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Razão Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Nome da empresa ou pessoa física"
                  className={validationErrors.companyName ? 'border-red-500' : ''}
                />
                {validationErrors.companyName && (
                  <p className="text-xs text-red-500">{validationErrors.companyName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">
                  CNPJ/CPF <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="document"
                  name="document"
                  value={formData.document}
                  onChange={handleInputChange}
                  placeholder="Documento"
                  className={validationErrors.document ? 'border-red-500' : ''}
                />
                {validationErrors.document && (
                  <p className="text-xs text-red-500">{validationErrors.document}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesPersonId">
                  Vendedor <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.salesPersonId} 
                  onValueChange={(value) => handleSelectChange('salesPersonId', value)}
                >
                  <SelectTrigger 
                    id="salesPersonId"
                    className={validationErrors.salesPersonId ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Selecione um vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_SALESPEOPLE.map(salesperson => (
                      <SelectItem key={salesperson.id} value={salesperson.id}>
                        {salesperson.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.salesPersonId && (
                  <p className="text-xs text-red-500">{validationErrors.salesPersonId}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultDiscount">Desconto Padrão (%)</Label>
                <Input
                  id="defaultDiscount"
                  name="defaultDiscount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.defaultDiscount}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDiscount">
                  Desconto Máximo (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="maxDiscount"
                  name="maxDiscount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.maxDiscount}
                  onChange={handleInputChange}
                  placeholder="15"
                  className={validationErrors.maxDiscount ? 'border-red-500' : ''}
                />
                {validationErrors.maxDiscount && (
                  <p className="text-xs text-red-500">{validationErrors.maxDiscount}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Limite máximo de desconto que pode ser aplicado aos produtos deste cliente
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">
                  Rua <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="Nome da rua"
                  className={validationErrors.street ? 'border-red-500' : ''}
                />
                {validationErrors.street && (
                  <p className="text-xs text-red-500">{validationErrors.street}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">
                    Número {!formData.noNumber && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="number"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    placeholder="Número"
                    disabled={formData.noNumber}
                    className={validationErrors.number ? 'border-red-500' : ''}
                  />
                  {validationErrors.number && (
                    <p className="text-xs text-red-500">{validationErrors.number}</p>
                  )}
                </div>
                <div className="flex items-end space-x-2 h-11">
                  <Switch
                    id="noNumber"
                    checked={formData.noNumber}
                    onCheckedChange={handleNoNumberChange}
                  />
                  <Label htmlFor="noNumber" className="cursor-pointer">Sem número</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  name="complement"
                  value={formData.complement}
                  onChange={handleInputChange}
                  placeholder="Complemento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  placeholder="CEP"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">
                  Cidade <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Cidade"
                  className={validationErrors.city ? 'border-red-500' : ''}
                />
                {validationErrors.city && (
                  <p className="text-xs text-red-500">{validationErrors.city}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">
                  Estado <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.state} 
                  onValueChange={(value) => handleSelectChange('state', value)}
                >
                  <SelectTrigger 
                    id="state"
                    className={validationErrors.state ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Selecione um estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name} ({state.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.state && (
                  <p className="text-xs text-red-500">{validationErrors.state}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Telefone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  className={validationErrors.email ? 'border-red-500' : ''}
                />
                {validationErrors.email && (
                  <p className="text-xs text-red-500">{validationErrors.email}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default CustomerForm;
