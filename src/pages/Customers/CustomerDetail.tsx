
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Edit, ArrowRight, Phone, Mail, MapPin, User, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCustomers } from '@/context/CustomerContext';
import { formatPhoneNumber, formatDocument } from '@/utils/formatters';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface SalesPersonData {
  name: string;
  email?: string;
}

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomerById } = useCustomers();
  const [salesPerson, setSalesPerson] = useState<SalesPersonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const customer = id ? getCustomerById(id) : undefined;

  useEffect(() => {
    if (!customer) {
      setIsLoading(false);
      return;
    }

    const fetchSalesPerson = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', customer.salesPersonId)
          .single();

        if (error) {
          console.error('Error fetching salesperson:', error);
          return;
        }

        if (data) {
          setSalesPerson({
            name: data.name,
            email: data.email || undefined
          });
        }
      } catch (error) {
        console.error('Error in fetching salesperson:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesPerson();
  }, [customer]);

  if (!customer && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-semibold mb-4">Cliente não encontrado</h2>
        <p className="text-muted-foreground mb-8">O cliente que você está procurando não existe ou foi removido.</p>
        <Button onClick={() => navigate('/customers')} variant="default">
          Voltar para a lista de clientes
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded"></div>
        <div className="space-y-4">
          <div className="h-40 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-40 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-40 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  const formatDate = (date?: Date) => {
    if (!date) return 'Não definida';
    return format(date, 'dd/MM/yyyy');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => navigate('/customers')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{customer?.companyName}</h1>
        </div>
        <Button onClick={() => navigate(`/customers/${id}/edit`)} className="bg-ferplas-500 hover:bg-ferplas-600">
          <Edit className="mr-2 h-4 w-4" /> Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CNPJ/CPF</p>
                <p className="text-lg">{customer?.document ? formatDocument(customer.document) : '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="text-lg">{formatDate(customer?.registerDate || customer?.createdAt)}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Contato</p>
              <div className="space-y-2">
                {customer?.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p>Telefone: {formatPhoneNumber(customer.phone)}</p>
                  </div>
                )}
                {customer?.whatsApp && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p>WhatsApp: {formatPhoneNumber(customer.whatsApp)}</p>
                  </div>
                )}
                {customer?.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p>Email: {customer.email}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Endereço</p>
              <div className="space-y-2">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                  <div>
                    <p>
                      {customer?.street}
                      {customer?.noNumber ? ' S/N' : customer?.number ? `, ${customer.number}` : ''}
                      {customer?.complement ? ` - ${customer.complement}` : ''}
                    </p>
                    <p>{customer?.city}, {customer?.state}</p>
                    <p>CEP: {customer?.zipCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendedor Responsável</CardTitle>
            </CardHeader>
            <CardContent>
              {salesPerson ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p>{salesPerson.name}</p>
                  </div>
                  {salesPerson.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p className="text-sm">{salesPerson.email}</p>
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
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Desconto Padrão</p>
                <p className="text-lg">{customer?.defaultDiscount}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Desconto Máximo</p>
                <p className="text-lg">{customer?.maxDiscount}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={() => navigate('/customers')}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para a lista
        </Button>
        <Button onClick={() => navigate(`/orders/new?customerId=${id}`)} className="bg-ferplas-500 hover:bg-ferplas-600">
          Criar Pedido <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CustomerDetail;
