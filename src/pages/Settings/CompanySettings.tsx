
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCompany, CompanyInfo } from '@/context/CompanyContext';
import { Building2, Save, Undo } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CompanySettings = () => {
  const { companyInfo, saveCompanyInfo, isLoading } = useCompany();
  
  const { register, handleSubmit, reset, formState: { isDirty, isSubmitting } } = useForm<CompanyInfo>({
    defaultValues: companyInfo
  });

  // Reset form when companyInfo changes (e.g. after loading from storage/API)
  useEffect(() => {
    reset(companyInfo);
  }, [companyInfo, reset]);

  const onSubmit = async (data: CompanyInfo) => {
    await saveCompanyInfo(data);
  };

  const handleReset = () => {
    reset(companyInfo);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Dados da Empresa</h1>
          <p className="text-muted-foreground">
            Configure as informações da sua empresa que aparecerão em documentos e impressões.
          </p>
        </header>
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60 mt-1" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dados da Empresa</h1>
        <p className="text-muted-foreground">
          Configure as informações da sua empresa que aparecerão em documentos e impressões.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-ferplas-50 border border-ferplas-100">
                <Building2 className="h-6 w-6 text-ferplas-600" />
              </div>
              <div>
                <CardTitle>Informações Corporativas</CardTitle>
                <CardDescription>Dados de identificação da sua empresa</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input 
                  id="name" 
                  placeholder="Razão Social" 
                  {...register('name', { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">CNPJ</Label>
                <Input 
                  id="document" 
                  placeholder="00.000.000/0000-00" 
                  {...register('document', { required: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
              <Input 
                id="stateRegistration" 
                placeholder="000.000.000.000" 
                {...register('stateRegistration')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input 
                id="address" 
                placeholder="Rua, número, complemento" 
                {...register('address', { required: true })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input 
                  id="city" 
                  placeholder="Cidade" 
                  {...register('city', { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input 
                  id="state" 
                  placeholder="UF" 
                  maxLength={2}
                  {...register('state', { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input 
                  id="zipCode" 
                  placeholder="00000-000" 
                  {...register('zipCode', { required: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  placeholder="(00) 0000-0000" 
                  {...register('phone', { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="email@empresa.com.br" 
                  {...register('email', { required: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Site</Label>
              <Input 
                id="website" 
                placeholder="www.empresa.com.br" 
                {...register('website')}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
                disabled={!isDirty || isSubmitting}
              >
                <Undo className="mr-2 h-4 w-4" />
                Restaurar
              </Button>
              <Button 
                type="submit"
                disabled={!isDirty || isSubmitting}
                className="bg-ferplas-500 hover:bg-ferplas-600"
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default CompanySettings;
