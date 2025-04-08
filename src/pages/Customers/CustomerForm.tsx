import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useCustomers } from '@/context/CustomerContext';
import { Customer, User, TransportCompany } from '@/types/types';
import { supabase } from '@/integrations/supabase/client';
import { adaptUserData } from '@/utils/adapters';
import { useAuth } from '@/context/AuthContext';

const CustomerForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addCustomer, updateCustomer, getCustomerById } = useCustomers();
  const { user: currentUser } = useAuth();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [salespeople, setSalespeople] = useState<User[]>([]);
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
  const [isLoadingSalespeople, setIsLoadingSalespeople] = useState(false);
  const [isLoadingTransportCompanies, setIsLoadingTransportCompanies] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const isSalesperson = currentUser?.userTypeId === 'c5ee0433-3faf-46a4-a516-be7261bfe575';
  
  const [formValues, setFormValues] = useState<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>({
    companyName: '',
    document: '',
    salesPersonId: currentUser?.id || '',
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
    transportCompanyId: undefined
  });

  useEffect(() => {
    const fetchSalespeople = async () => {
      setIsLoadingSalespeople(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*, user_type:user_types(*)')
          .eq('is_active', true);

        if (error) {
          throw error;
        }

        if (data) {
          const formattedUsers = data.map(user => adaptUserData({
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.user_type?.name || 'salesperson',
            email: user.email || '',
            created_at: user.created_at,
            user_type_id: user.user_type_id
          }));
          
          setSalespeople(formattedUsers);
          console.log('Fetched salespeople:', formattedUsers);
        }
      } catch (error) {
        console.error('Error fetching salespeople:', error);
        toast.error('Erro ao carregar vendedores');
      } finally {
        setIsLoadingSalespeople(false);
      }
    };

    const fetchTransportCompanies = async () => {
      setIsLoadingTransportCompanies(true);
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
          console.log('Fetched transport companies:', data);
        }
      } catch (error) {
        console.error('Error fetching transport companies:', error);
        toast.error('Erro ao carregar transportadoras');
      } finally {
        setIsLoadingTransportCompanies(false);
      }
    };

    fetchSalespeople();
    fetchTransportCompanies();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      const customer = getCustomerById(id);
      if (customer) {
        console.log('Loading customer data:', customer);
        
        const { id: customerId, createdAt, updatedAt, ...customerValues } = customer;
        
        if (customerValues.salesPersonId) {
          console.log('Setting salesPersonId to:', customerValues.salesPersonId);
        } else {
          console.log('No salesPersonId found in customer data');
        }
        
        console.log('Transport company ID from customer data:', customerValues.transportCompanyId);
        
        setFormValues(customerValues);
      } else {
        toast.error('Cliente não encontrado');
        navigate('/customers');
      }
    }
  }, [isEditing, id, getCustomerById, navigate, salespeople]);

  const handleChange = (field: keyof typeof formValues, value: any) => {
    if (field === 'transportCompanyId' && value === 'none') {
      setFormValues(prev => ({ ...prev, [field]: undefined }));
      console.log('Setting transportCompanyId to undefined');
      return;
    }
    
    setFormValues(prev => ({ ...prev, [field]: value }));
    
    if (field === 'salesPersonId' && value) {
      setValidationError(null);
    }
    
    if (field === 'transportCompanyId') {
      console.log(`Setting transportCompanyId to: ${value}`);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formValues.salesPersonId) {
        setValidationError('É necessário selecionar um vendedor');
        setIsLoading(false);
        toast.error('Por favor, selecione um vendedor');
        return;
      }
      
      console.log('Submitting customer data with transportCompanyId:', formValues.transportCompanyId);
      
      const customerData = {
        ...formValues,
        phone: formValues.phone.toString(),
        number: formValues.number.toString(),
        defaultDiscount: Number(formValues.defaultDiscount),
        maxDiscount: Number(formValues.maxDiscount),
        transportCompanyId: formValues.transportCompanyId
      };

      let result;
      if (isEditing && id) {
        result = await updateCustomer(id, customerData);
        if (result) {
          toast.success('Cliente atualizado com sucesso!');
          navigate(`/customers/${id}`);
        }
      } else {
        result = await addCustomer(customerData);
        if (result) {
          toast.success('Cliente adicionado com sucesso!');
          navigate(`/customers/${result.id}`);
        }
      }

      if (!result) {
        throw new Error('Erro ao processar dados do cliente');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Erro ao salvar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const brStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => navigate('/customers')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Razão Social *</Label>
                <Input 
                  id="companyName" 
                  value={formValues.companyName} 
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">CNPJ / CPF *</Label>
                <Input 
                  id="document" 
                  value={formValues.document} 
                  onChange={(e) => handleChange('document', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
                <Input 
                  id="stateRegistration" 
                  value={formValues.stateRegistration || ''} 
                  onChange={(e) => handleChange('stateRegistration', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salesPerson" className={validationError ? "text-red-500" : ""}>
                  Vendedor *
                </Label>
                <Select 
                  value={formValues.salesPersonId} 
                  onValueChange={(value) => handleChange('salesPersonId', value)}
                  disabled={isSalesperson}
                  required
                >
                  <SelectTrigger className={validationError ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione um vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {!isLoadingSalespeople && salespeople.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationError && (
                  <p className="text-xs text-red-500 mt-1">{validationError}</p>
                )}
                {isSalesperson && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Como você é vendedor, você é automaticamente atribuído como vendedor deste cliente.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="registerDate">Data de Cadastro *</Label>
                <Input 
                  id="registerDate" 
                  type="date"
                  value={formatDateForInput(formValues.registerDate)}
                  onChange={(e) => handleChange('registerDate', new Date(e.target.value))}
                  required
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  value={formValues.phone} 
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input 
                  id="whatsapp" 
                  value={formValues.whatsapp} 
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={formValues.email} 
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportCompany">Transportadora padrão</Label>
              <Select 
                value={formValues.transportCompanyId || 'none'} 
                onValueChange={(value) => handleChange('transportCompanyId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma transportadora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="no-company" value="none">Nenhuma</SelectItem>
                  {!isLoadingTransportCompanies && transportCompanies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Logradouro *</Label>
              <Input 
                id="street" 
                value={formValues.street} 
                onChange={(e) => handleChange('street', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input 
                id="neighborhood" 
                value={formValues.neighborhood} 
                onChange={(e) => handleChange('neighborhood', e.target.value)}
              />
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input 
                  id="number" 
                  value={formValues.number} 
                  onChange={(e) => handleChange('number', e.target.value)}
                  disabled={formValues.noNumber}
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox 
                  id="noNumber" 
                  checked={formValues.noNumber} 
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    handleChange('noNumber', isChecked);
                    if (isChecked) {
                      handleChange('number', '');
                    }
                  }}
                />
                <Label htmlFor="noNumber" className="cursor-pointer">Sem número</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input 
                  id="complement" 
                  value={formValues.complement} 
                  onChange={(e) => handleChange('complement', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input 
                  id="city" 
                  value={formValues.city} 
                  onChange={(e) => handleChange('city', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Select 
                  value={formValues.state} 
                  onValueChange={(value) => handleChange('state', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {brStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP *</Label>
                <Input 
                  id="zipCode" 
                  value={formValues.zipCode} 
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações de Desconto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultDiscount">Desconto Padrão (%)</Label>
                <Input 
                  id="defaultDiscount" 
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formValues.defaultDiscount} 
                  onChange={(e) => handleChange('defaultDiscount', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDiscount">Desconto Máximo (%)</Label>
                <Input 
                  id="maxDiscount" 
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formValues.maxDiscount} 
                  onChange={(e) => handleChange('maxDiscount', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <CardFooter className="flex justify-between px-0">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate('/customers')}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={isLoading}
            className="bg-ferplas-500 hover:bg-ferplas-600"
          >
            {isLoading ? (
              <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin mr-2" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? 'Atualizar' : 'Salvar'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
};

export default CustomerForm;
