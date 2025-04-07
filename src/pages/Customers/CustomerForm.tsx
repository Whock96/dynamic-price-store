import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCustomers } from '@/context/CustomerContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDocument, formatPhoneNumber } from '@/utils/formatters';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

// Import the transport companies context
import { useTransportCompanies } from '@/context/TransportCompanyContext';

const customerSchema = z.object({
  companyName: z.string().min(3, { message: "O nome da empresa deve ter pelo menos 3 caracteres." }),
  document: z.string().min(11, { message: "O documento deve ter pelo menos 11 caracteres (CPF/CNPJ)." }),
  salesPersonId: z.string().uuid({ message: "Selecione um vendedor válido." }),
  street: z.string().min(3, { message: "A rua deve ter pelo menos 3 caracteres." }),
  number: z.string().optional(),
  noNumber: z.boolean().default(false),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, { message: "O bairro deve ter pelo menos 3 caracteres." }),
  city: z.string().min(3, { message: "A cidade deve ter pelo menos 3 caracteres." }),
  state: z.string().length(2, { message: "Selecione um estado válido." }),
  zipCode: z.string().min(8, { message: "O CEP deve ter pelo menos 8 caracteres." }),
  phone: z.string().optional(),
  email: z.string().email({ message: "Insira um email válido." }).optional(),
  whatsapp: z.string().optional(),
  stateRegistration: z.string().optional(),
  defaultDiscount: z.number().min(0, { message: "O desconto padrão deve ser no mínimo 0." }).max(100, { message: "O desconto padrão deve ser no máximo 100." }),
  maxDiscount: z.number().min(0, { message: "O desconto máximo deve ser no mínimo 0." }).max(100, { message: "O desconto máximo deve ser no máximo 100." }),
  registerDate: z.date(),
  transportCompanyId: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { 
    getCustomerById, 
    addCustomer, 
    updateCustomer, 
    isLoading: isCustomerLoading 
  } = useCustomers();
  const { user, hasPermission, isLoading: isAuthLoading } = useAuth();

  // Add the transport companies context
  const { companies, isLoading: isLoadingCompanies } = useTransportCompanies();

  const [isNoNumber, setIsNoNumber] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<Partial<CustomerFormValues>>({});

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      companyName: '',
      document: '',
      salesPersonId: '',
      street: '',
      number: '',
      noNumber: false,
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      whatsapp: '',
      stateRegistration: '',
      defaultDiscount: 0,
      maxDiscount: 0,
      registerDate: new Date(),
      transportCompanyId: '',
    },
    mode: "onChange"
  });

  const { 
    handleSubmit, 
    control, 
    setValue, 
    formState: { errors, isValid },
    watch
  } = form;

  const watchNoNumber = watch("noNumber");

  useEffect(() => {
    setIsNoNumber(watchNoNumber);
  }, [watchNoNumber]);

  const loadCustomer = useCallback(async (customerId: string) => {
    if (customerId) {
      setIsLoading(true);
      const customer = getCustomerById(customerId);
      if (customer) {
        setFormState(customer);
        
        // Set form values using setValue
        setValue('companyName', customer.companyName);
        setValue('document', customer.document);
        setValue('salesPersonId', customer.salesPersonId);
        setValue('street', customer.street);
        setValue('number', customer.number || '');
        setValue('noNumber', customer.noNumber || false);
        setValue('complement', customer.complement || '');
        setValue('neighborhood', customer.neighborhood || '');
        setValue('city', customer.city);
        setValue('state', customer.state);
        setValue('zipCode', customer.zipCode);
        setValue('phone', customer.phone || '');
        setValue('email', customer.email || '');
        setValue('whatsapp', customer.whatsapp || '');
        setValue('stateRegistration', customer.stateRegistration || '');
        setValue('defaultDiscount', customer.defaultDiscount);
        setValue('maxDiscount', customer.maxDiscount);
        setValue('registerDate', new Date(customer.registerDate));
        setValue('transportCompanyId', customer.transportCompanyId || '');
      }
      setIsLoading(false);
    }
  }, [getCustomerById, setValue]);

  useEffect(() => {
    if (id) {
      loadCustomer(id);
    }
  }, [id, loadCustomer]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
		setFormState(prevState => ({
			...prevState,
			[name]: checked,
		}));
	};

  const onSubmit = async (data: CustomerFormValues) => {
    setIsLoading(true);
    try {
      if (id) {
        // Update existing customer
        const updatedCustomer = await updateCustomer(id, data);
        if (updatedCustomer) {
          toast.success('Cliente atualizado com sucesso!');
          navigate('/customers');
        } else {
          toast.error('Erro ao atualizar cliente.');
        }
      } else {
        // Create new customer
        const newCustomer = await addCustomer(data);
        if (newCustomer) {
          toast.success('Cliente criado com sucesso!');
          navigate('/customers');
        } else {
          toast.error('Erro ao criar cliente.');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Ocorreu um erro ao salvar o cliente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  // Check permission
  if (!hasPermission('customers_manage')) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <h2 className="text-2xl font-semibold text-gray-800">Acesso Restrito</h2>
        <p className="mt-2 text-gray-600">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white to-gray-100">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-ferplas-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{id ? 'Editar Cliente' : 'Novo Cliente'}</h1>
          <p className="text-muted-foreground">
            Preencha as informações abaixo para {id ? 'atualizar' : 'criar'} um cliente.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/customers')}
            className="mr-2"
          >
            Cancelar
          </Button>
          <Button 
            className={cn(
              "bg-ferplas-500 hover:bg-ferplas-600",
              isLoading && "cursor-not-allowed"
            )}
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid || isLoading || isCustomerLoading}
          >
            {isLoading || isCustomerLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div className="p-4 bg-white rounded-md shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Informações da Empresa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Nome da Empresa <span className="text-red-500">*</span></Label>
              <Input
                id="companyName"
                name="companyName"
                type="text"
                placeholder="Nome da empresa"
                {...control("companyName")}
                className={cn(errors.companyName && "border-red-500")}
              />
              {errors.companyName && (
                <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="document">CNPJ/CPF <span className="text-red-500">*</span></Label>
              <Input
                id="document"
                name="document"
                type="text"
                placeholder="CNPJ ou CPF"
                {...control("document")}
                className={cn(errors.document && "border-red-500")}
                onChange={(e) => {
                  const value = e.target.value;
                  setValue("document", value);
                  handleInputChange(e);
                }}
                value={formState.document || ''}
                onBlur={(e) => {
                  const formattedDocument = formatDocument(e.target.value);
                  setValue("document", formattedDocument || '');
                  setFormState(prevState => ({
                    ...prevState,
                    document: formattedDocument || ''
                  }));
                }}
              />
              {errors.document && (
                <p className="text-red-500 text-sm mt-1">{errors.document.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="salesPersonId">Vendedor <span className="text-red-500">*</span></Label>
              <Select
                onValueChange={(value) => {
                  setValue("salesPersonId", value);
                  handleInputChange({ target: { name: 'salesPersonId', value } } as any);
                }}
                defaultValue={formState.salesPersonId || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {user.role === 'administrator' ? (
                    // If admin, show all salespeople
                    user.users?.map((salesperson) => (
                      <SelectItem key={salesperson.id} value={salesperson.id}>
                        {salesperson.name}
                      </SelectItem>
                    ))
                  ) : (
                    // If salesperson, show only themselves
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.salesPersonId && (
                <p className="text-red-500 text-sm mt-1">{errors.salesPersonId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
              <Input
                id="stateRegistration"
                name="stateRegistration"
                type="text"
                placeholder="Número da Inscrição Estadual"
                {...control("stateRegistration")}
                onChange={handleInputChange}
                value={formState.stateRegistration || ''}
              />
              {errors.stateRegistration && (
                <p className="text-red-500 text-sm mt-1">{errors.stateRegistration.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-md shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Endereço</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="street">Rua <span className="text-red-500">*</span></Label>
              <Input
                id="street"
                name="street"
                type="text"
                placeholder="Rua"
                {...control("street")}
                className={cn(errors.street && "border-red-500")}
                onChange={handleInputChange}
                value={formState.street || ''}
              />
              {errors.street && (
                <p className="text-red-500 text-sm mt-1">{errors.street.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="number">Número <span className="text-muted-foreground">(Opcional)</span></Label>
              <Input
                id="number"
                name="number"
                type="text"
                placeholder="Número"
                {...control("number")}
                className={cn(errors.number && "border-red-500")}
                onChange={handleInputChange}
                value={formState.number || ''}
                disabled={isNoNumber}
              />
              {errors.number && (
                <p className="text-red-500 text-sm mt-1">{errors.number.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <Switch
                id="noNumber"
                name="noNumber"
                checked={isNoNumber}
                onCheckedChange={(checked) => {
                  setIsNoNumber(checked);
                  setValue("noNumber", checked);
                  handleSwitchChange("noNumber", checked);
                }}
              />
              <Label htmlFor="noNumber">Sem número</Label>
            </div>

            <div>
              <Label htmlFor="complement">Complemento <span className="text-muted-foreground">(Opcional)</span></Label>
              <Input
                id="complement"
                name="complement"
                type="text"
                placeholder="Complemento"
                {...control("complement")}
                className={cn(errors.complement && "border-red-500")}
                onChange={handleInputChange}
                value={formState.complement || ''}
              />
              {errors.complement && (
                <p className="text-red-500 text-sm mt-1">{errors.complement.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="neighborhood">Bairro <span className="text-red-500">*</span></Label>
              <Input
                id="neighborhood"
                name="neighborhood"
                type="text"
                placeholder="Bairro"
                {...control("neighborhood")}
                className={cn(errors.neighborhood && "border-red-500")}
                onChange={handleInputChange}
                value={formState.neighborhood || ''}
              />
              {errors.neighborhood && (
                <p className="text-red-500 text-sm mt-1">{errors.neighborhood.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="city">Cidade <span className="text-red-500">*</span></Label>
              <Input
                id="city"
                name="city"
                type="text"
                placeholder="Cidade"
                {...control("city")}
                className={cn(errors.city && "border-red-500")}
                onChange={handleInputChange}
                value={formState.city || ''}
              />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="state">Estado <span className="text-red-500">*</span></Label>
              <Select
                onValueChange={(value) => {
                  setValue("state", value);
                  handleInputChange({ target: { name: 'state', value } } as any);
                }}
                defaultValue={formState.state || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AC">Acre</SelectItem>
                  <SelectItem value="AL">Alagoas</SelectItem>
                  <SelectItem value="AP">Amapá</SelectItem>
                  <SelectItem value="AM">Amazonas</SelectItem>
                  <SelectItem value="BA">Bahia</SelectItem>
                  <SelectItem value="CE">Ceará</SelectItem>
                  <SelectItem value="DF">Distrito Federal</SelectItem>
                  <SelectItem value="ES">Espírito Santo</SelectItem>
                  <SelectItem value="GO">Goiás</SelectItem>
                  <SelectItem value="MA">Maranhão</SelectItem>
                  <SelectItem value="MT">Mato Grosso</SelectItem>
                  <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                  <SelectItem value="MG">Minas Gerais</SelectItem>
                  <SelectItem value="PA">Pará</SelectItem>
                  <SelectItem value="PB">Paraíba</SelectItem>
                  <SelectItem value="PR">Paraná</SelectItem>
                  <SelectItem value="PE">Pernambuco</SelectItem>
                  <SelectItem value="PI">Piauí</SelectItem>
                  <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                  <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                  <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                  <SelectItem value="RO">Rondônia</SelectItem>
                  <SelectItem value="RR">Roraima</SelectItem>
                  <SelectItem value="SC">Santa Catarina</SelectItem>
                  <SelectItem value="SP">São Paulo</SelectItem>
                  <SelectItem value="SE">Sergipe</SelectItem>
                  <SelectItem value="TO">Tocantins</SelectItem>
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="zipCode">CEP <span className="text-red-500">*</span></Label>
              <Input
                id="zipCode"
                name="zipCode"
                type="text"
                placeholder="CEP"
                {...control("zipCode")}
                className={cn(errors.zipCode && "border-red-500")}
                onChange={handleInputChange}
                value={formState.zipCode || ''}
              />
              {errors.zipCode && (
                <p className="text-red-500 text-sm mt-1">{errors.zipCode.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-md shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefone <span className="text-muted-foreground">(Opcional)</span></Label>
              <Input
                id="phone"
                name="phone"
                type="text"
                placeholder="Telefone"
                {...control("phone")}
                className={cn(errors.phone && "border-red-500")}
                onChange={(e) => {
                  const value = e.target.value;
                  setValue("phone", value);
                  handleInputChange(e);
                }}
                value={formState.phone || ''}
                onBlur={(e) => {
                  const formattedPhone = formatPhoneNumber(e.target.value);
                  setValue("phone", formattedPhone || '');
                  setFormState(prevState => ({
                    ...prevState,
                    phone: formattedPhone || ''
                  }));
                }}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email <span className="text-muted-foreground">(Opcional)</span></Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                {...control("email")}
                className={cn(errors.email && "border-red-500")}
                onChange={handleInputChange}
                value={formState.email || ''}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp <span className="text-muted-foreground">(Opcional)</span></Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                type="text"
                placeholder="WhatsApp"
                {...control("whatsapp")}
                className={cn(errors.whatsapp && "border-red-500")}
                onChange={(e) => {
                  const value = e.target.value;
                  setValue("whatsapp", value);
                  handleInputChange(e);
                }}
                value={formState.whatsapp || ''}
                onBlur={(e) => {
                  const formattedWhatsapp = formatPhoneNumber(e.target.value);
                  setValue("whatsapp", formattedWhatsapp || '');
                  setFormState(prevState => ({
                    ...prevState,
                    whatsapp: formattedWhatsapp || ''
                  }));
                }}
              />
              {errors.whatsapp && (
                <p className="text-red-500 text-sm mt-1">{errors.whatsapp.message}</p>
              )}
            </div>
          </div>
        </div>

  {/* After the address section and before the discount section, add the transport company selection */}
  <div className="p-4 bg-white rounded-md shadow-sm">
    <h2 className="text-lg font-semibold mb-4">Informações de Transportadora</h2>
    <div className="grid grid-cols-1 gap-4">
      <div>
        <Label htmlFor="transportCompanyId">Transportadora Padrão</Label>
        <Select 
          value={formState.transportCompanyId || ""}
          onValueChange={(value) => {
            setValue("transportCompanyId", value);
            handleInputChange({ target: { name: 'transportCompanyId', value } } as any);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma transportadora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nenhuma transportadora</SelectItem>
            {companies.map(company => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground mt-1">
          Transportadora padrão utilizada para entregas a este cliente.
        </p>
      </div>
    </div>
  </div>

        <div className="p-4 bg-white rounded-md shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Descontos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultDiscount">Desconto Padrão (%)</Label>
              <Input
                id="defaultDiscount"
                name="defaultDiscount"
                type="number"
                placeholder="Desconto Padrão"
                {...control("defaultDiscount", { valueAsNumber: true })}
                className={cn(errors.defaultDiscount && "border-red-500")}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setValue("defaultDiscount", value);
                  handleInputChange(e);
                }}
                value={formState.defaultDiscount || 0}
              />
              {errors.defaultDiscount && (
                <p className="text-red-500 text-sm mt-1">{errors.defaultDiscount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="maxDiscount">Desconto Máximo (%)</Label>
              <Input
                id="maxDiscount"
                name="maxDiscount"
                type="number"
                placeholder="Desconto Máximo"
                {...control("maxDiscount", { valueAsNumber: true })}
                className={cn(errors.maxDiscount && "border-red-500")}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setValue("maxDiscount", value);
                  handleInputChange(e);
                }}
                value={formState.maxDiscount || 0}
              />
              {errors.maxDiscount && (
                <p className="text-red-500 text-sm mt-1">{errors.maxDiscount.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-md shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Outras Informações</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="registerDate">Data de Cadastro <span className="text-red-500">*</span></Label>
              <Input
                id="registerDate"
                name="registerDate"
                type="date"
                placeholder="Data de Cadastro"
                {...control("registerDate")}
                className={cn(errors.registerDate && "border-red-500")}
                onChange={(e) => {
                  const value = e.target.value;
                  setValue("registerDate", new Date(value));
                  handleInputChange({ target: { name: 'registerDate', value } } as any);
                }}
                value={formState.registerDate ? new Date(formState.registerDate).toISOString().split('T')[0] : ''}
              />
              {errors.registerDate && (
                <p className="text-red-500 text-sm mt-1">{errors.registerDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="observations">Observações <span className="text-muted-foreground">(Opcional)</span></Label>
              <Textarea
                id="observations"
                name="observations"
                placeholder="Observações"
                className={cn(errors.observations && "border-red-500")}
                onChange={handleInputChange}
                value={formState.observations || ''}
              />
              {errors.observations && (
                <p className="text-red-500 text-sm mt-1">{errors.observations.message}</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
