
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database, ArrowUpCircle, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useCustomers } from '@/context/CustomerContext';
import { useProducts } from '@/context/ProductContext';
import { migrateCustomersToSupabase, migrateCategoriesToSupabase, migrateProductsToSupabase } from '@/utils/supabase-migration';
import { toast } from 'sonner';

const MigrationTool = () => {
  // Make sure we're properly accessing the context with useProducts()
  const { customers } = useCustomers();
  const { products, categories } = useProducts();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    customers: boolean | null;
    categories: boolean | null;
    products: boolean | null;
  }>({
    customers: null,
    categories: null,
    products: null
  });

  const handleMigrateAll = async () => {
    setIsMigrating(true);
    toast.info('Iniciando migração de dados para o Supabase...');

    try {
      // Migrar categorias primeiro
      const categoriesMigrated = await migrateCategoriesToSupabase(categories);
      setMigrationResult(prev => ({ ...prev, categories: categoriesMigrated }));
      
      // Migrar produtos
      const productsMigrated = await migrateProductsToSupabase(products);
      setMigrationResult(prev => ({ ...prev, products: productsMigrated }));
      
      // Migrar clientes
      const customersMigrated = await migrateCustomersToSupabase(customers);
      setMigrationResult(prev => ({ ...prev, customers: customersMigrated }));
      
      if (categoriesMigrated && productsMigrated && customersMigrated) {
        toast.success('Todos os dados foram migrados com sucesso para o Supabase!');
      }
    } catch (error) {
      console.error('Erro durante a migração:', error);
      toast.error('Ocorreu um erro durante o processo de migração');
    } finally {
      setIsMigrating(false);
    }
  };

  const getMigrationStatus = (status: boolean | null) => {
    if (status === null) return 'Pendente';
    return status ? 'Concluído' : 'Falhou';
  };

  const getMigrationIcon = (status: boolean | null) => {
    if (status === null) return <ArrowUpCircle className="h-4 w-4 text-gray-400" />;
    return status ? 
      <Check className="h-4 w-4 text-green-500" /> : 
      <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" /> 
          Ferramenta de Migração
        </CardTitle>
        <CardDescription>
          Migre seus dados locais para o banco de dados Supabase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertTitle>Importante!</AlertTitle>
          <AlertDescription>
            Esta ferramenta migrará todos os dados armazenados localmente para o banco de dados Supabase.
            Os dados já existentes no Supabase com os mesmos IDs serão atualizados.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getMigrationIcon(migrationResult.customers)}
              <span>Clientes ({customers.length})</span>
            </div>
            <span className="text-sm text-gray-500">{getMigrationStatus(migrationResult.customers)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getMigrationIcon(migrationResult.categories)}
              <span>Categorias ({categories.length})</span>
            </div>
            <span className="text-sm text-gray-500">{getMigrationStatus(migrationResult.categories)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getMigrationIcon(migrationResult.products)}
              <span>Produtos ({products.length})</span>
            </div>
            <span className="text-sm text-gray-500">{getMigrationStatus(migrationResult.products)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleMigrateAll} 
          className="w-full bg-ferplas-500 hover:bg-ferplas-600"
          disabled={isMigrating}
        >
          {isMigrating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrando dados...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Iniciar Migração
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MigrationTool;
