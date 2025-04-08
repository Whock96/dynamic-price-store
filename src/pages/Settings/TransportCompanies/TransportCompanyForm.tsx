
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTransportCompanies } from '@/context/TransportCompanyContext';
import { TransportCompany } from '@/types/types';

const TransportCompanyForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addTransportCompany, updateTransportCompany, getTransportCompanyById } = useTransportCompanies();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(false);
  
  // Default form values
  const [formValues, setFormValues] = useState<Omit<TransportCompany, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    document: '',
    email: '',
    phone: '',
    whatsapp: '',
  });

  // Load transport company data if editing
  useEffect(() => {
    if (isEditing && id) {
      const company = getTransportCompanyById(id);
      if (company) {
        console.log('Loading transport company data:', company);
        
        // Remove id, createdAt, and updatedAt from company object
        const { id: companyId, createdAt, updatedAt, ...companyValues } = company;
        
        setFormValues(companyValues);
      } else {
        toast.error('Transportadora não encontrada');
        navigate('/settings/transport-companies');
      }
    }
  }, [isEditing, id, getTransportCompanyById, navigate]);

  // Handles form input changes
  const handleChange = (field: keyof typeof formValues, value: any) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      if (isEditing && id) {
        // Update existing transport company
        result = await updateTransportCompany(id, formValues);
        if (result) {
          toast.success('Transportadora atualizada com sucesso!');
          navigate('/settings/transport-companies');
        }
      } else {
        // Add new transport company
        result = await addTransportCompany(formValues);
        if (result) {
          toast.success('Transportadora adicionada com sucesso!');
          navigate('/settings/transport-companies');
        }
      }

      if (!result) {
        throw new Error('Erro ao processar dados da transportadora');
      }
    } catch (error) {
      console.error('Error saving transport company:', error);
      toast.error('Erro ao salvar transportadora');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => navigate('/settings/transport-companies')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Editar Transportadora' : 'Nova Transportadora'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Transportadora</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input 
                  id="name" 
                  value={formValues.name} 
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">CNPJ *</Label>
                <Input 
                  id="document" 
                  value={formValues.document} 
                  onChange={(e) => handleChange('document', e.target.value)}
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
          </CardContent>
        </Card>

        <CardFooter className="flex justify-between px-0">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate('/settings/transport-companies')}
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

export default TransportCompanyForm;
