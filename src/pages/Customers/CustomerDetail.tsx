import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Edit, Phone, Mail, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCustomers } from '@/context/CustomerContext';
import { Customer } from '@/types/types';
import { formatPhoneNumber, formatDocument, formatCurrency } from '@/utils/formatters';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface SalesPersonInfo {
  name: string;
  email: string;
  phone?: string;
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomerById } = useCustomers();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [salesPerson, setSalesPerson] = useState<SalesPersonInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!id) return;
      
      setLoading(true);
      
      try {
        const foundCustomer = getCustomerById(id);
        
        if (!foundCustomer) {
          navigate('/customers');
          return;
        }
        
        setCustomer(foundCustomer);
        
        // Fetch salesperson information
        if (foundCustomer.salesPersonId) {
          const { data, error } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', foundCustomer.salesPersonId)
            .single();
          
          if (error) {
            console.error('Error fetching salesperson:', error);
            throw error;
          }
          
          if (data) {
            setSalesPerson({
              name: data.name,
              email: data.email || '',
              phone: ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching customer data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomerData();
  }, [id, getCustomerById, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-t-transparent border-ferplas-500 animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">Cliente não encontrado</h2>
        <p className="mt-2 text-muted-foreground">
          O cliente solicitado não foi encontrado ou não existe mais.
        </p>
        <Button 
          onClick={() => navigate('/customers')} 
          variant="outline" 
          className="mt-4"
        >
          Voltar para a lista de clientes
        </Button>
      </div>
    );
  }

  // Format register date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => navigate('/customers')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{customer.companyName}</h1>
          {customer.document && (
            <Badge variant="outline" className="ml-2">
              {formatDocument(customer.document)}
            </Badge>
          )}
        </div>
        <Button 
          onClick={() => navigate(`/customers/${id}/edit`)} 
          className="bg-ferplas-500 hover:bg-ferplas-600"
        >
          <Edit className="mr-2 h-4 w-4" /> Editar Cliente
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
                  <p>{formatDate(customer.registerDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CNPJ/CPF</p>
                  <p>{formatDocument(customer.document)}</p>
                </div>
                {customer.stateRegistration && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inscrição Estadual</p>
                    <p>{customer.stateRegistration}</p>
                  </div>
                )}
              </div>

              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Contato</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone ? formatPhoneNumber(customer.phone) : 'Não informado'}</span>
                </div>
                {customer.whatsapp && (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-muted-foreground" viewBox="0 0 16 16">
                      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                    </svg>
                    <span>{formatPhoneNumber(customer.whatsapp)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email || 'Não informado'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p>
                    {customer.street}
                    {customer.noNumber ? ', S/N' : customer.number ? `, ${customer.number}` : ''}
                    {customer.complement ? ` - ${customer.complement}` : ''}
                    {customer.neighborhood ? ` - Bairro ${customer.neighborhood}` : ''}
                  </p>
                  <p>
                    {customer.city}, {customer.state} - CEP: {customer.zipCode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendedor Responsável</CardTitle>
            </CardHeader>
            <CardContent>
              {salesPerson ? (
                <div className="space-y-2">
                  <p className="font-medium">{salesPerson.name}</p>
                  {salesPerson.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{salesPerson.email}</span>
                    </div>
                  )}
                  {salesPerson.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatPhoneNumber(salesPerson.phone)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Informações do vendedor não disponíveis</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações de Desconto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Desconto Padrão</p>
                  <p className="text-lg font-semibold">{customer.defaultDiscount}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Desconto Máximo</p>
                  <p className="text-lg font-semibold">{customer.maxDiscount}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
