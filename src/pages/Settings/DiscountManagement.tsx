
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save,
  DollarSign, Truck, ShoppingBasket, CreditCard,
  PercentIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useDiscountSettings } from '@/hooks/use-discount-settings';

const DiscountManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, isLoading, saveSettings } = useDiscountSettings();
  // Initialize with default empty structure matching the settings shape
  const [formData, setFormData] = useState({
    pickup: 0,
    cashPayment: 0,
    halfInvoice: 0,
    taxSubstitution: 0,
    ipiRate: 0,
    deliveryFees: {
      capital: 0,
      interior: 0
    }
  });

  // Verify if user is administrator
  useEffect(() => {
    if (user?.role !== 'administrator') {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Update formData when settings are loaded
  useEffect(() => {
    if (!isLoading && settings) {
      setFormData(settings);
    }
  }, [settings, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties for delivery fees
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'deliveryFees') {
        setFormData(prev => ({
          ...prev,
          deliveryFees: {
            ...prev.deliveryFees,
            [child]: parseFloat(value) || 0
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    }
  };

  const handleSaveSettings = () => {
    const success = saveSettings(formData);
    if (success) {
      toast.success('Configurações de descontos salvas com sucesso');
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
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Descontos</h1>
            <p className="text-muted-foreground">
              Configure os valores de descontos e taxas aplicados no carrinho
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
            onClick={handleSaveSettings}
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ferplas-500"></div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Opções de Desconto</CardTitle>
              <CardDescription>
                Configure os percentuais aplicados para cada tipo de desconto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Opção</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right w-[200px]">Valor (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <ShoppingBasket className="mr-2 h-4 w-4 text-amber-500" />
                        Retirada
                      </div>
                    </TableCell>
                    <TableCell>Desconto para retirada na loja</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Input
                          type="number"
                          name="pickup"
                          className="w-24 text-right"
                          value={formData.pickup}
                          onChange={handleInputChange}
                          min="0"
                          step="0.1"
                        />
                        <span className="font-medium">%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4 text-green-500" />
                        À Vista
                      </div>
                    </TableCell>
                    <TableCell>Desconto para pagamento à vista</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Input
                          type="number"
                          name="cashPayment"
                          className="w-24 text-right"
                          value={formData.cashPayment}
                          onChange={handleInputChange}
                          min="0"
                          step="0.1"
                        />
                        <span className="font-medium">%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <PercentIcon className="mr-2 h-4 w-4 text-blue-500" />
                        Meia Nota
                      </div>
                    </TableCell>
                    <TableCell>Desconto para meia nota fiscal</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Input
                          type="number"
                          name="halfInvoice"
                          className="w-24 text-right"
                          value={formData.halfInvoice}
                          onChange={handleInputChange}
                          min="0"
                          step="0.1"
                        />
                        <span className="font-medium">%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4 text-red-500" />
                        Substituição Tributária
                      </div>
                    </TableCell>
                    <TableCell>Acréscimo para substituição tributária</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Input
                          type="number"
                          name="taxSubstitution"
                          className="w-24 text-right"
                          value={formData.taxSubstitution}
                          onChange={handleInputChange}
                          min="0"
                          step="0.1"
                        />
                        <span className="font-medium">%</span>
                      </div>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <PercentIcon className="mr-2 h-4 w-4 text-purple-500" />
                        IPI
                      </div>
                    </TableCell>
                    <TableCell>Taxa de IPI aplicada quando selecionado</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Input
                          type="number"
                          name="ipiRate"
                          className="w-24 text-right"
                          value={formData.ipiRate}
                          onChange={handleInputChange}
                          min="0"
                          step="0.1"
                        />
                        <span className="font-medium">%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Taxas de Entrega</CardTitle>
              <CardDescription>
                Configure os valores das taxas de entrega para cada região
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Truck className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium text-lg">Capital</h3>
                  </div>
                  <div>
                    <Label htmlFor="capitalFee">Valor da entrega na capital</Label>
                    <div className="flex items-center mt-2">
                      <span className="bg-gray-100 p-2 border border-r-0 rounded-l-md">R$</span>
                      <Input
                        id="capitalFee"
                        type="number"
                        name="deliveryFees.capital"
                        value={formData.deliveryFees.capital}
                        onChange={handleInputChange}
                        className="rounded-l-none"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Truck className="h-5 w-5 text-green-500" />
                    <h3 className="font-medium text-lg">Interior</h3>
                  </div>
                  <div>
                    <Label htmlFor="interiorFee">Valor da entrega para o interior</Label>
                    <div className="flex items-center mt-2">
                      <span className="bg-gray-100 p-2 border border-r-0 rounded-l-md">R$</span>
                      <Input
                        id="interiorFee"
                        type="number"
                        name="deliveryFees.interior"
                        value={formData.deliveryFees.interior}
                        onChange={handleInputChange}
                        className="rounded-l-none"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Instruções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                As configurações desta página afetam diretamente os cálculos de preço no carrinho de compras. 
                Após alterar qualquer valor, certifique-se de clicar em "Salvar Alterações".
              </p>
              
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-blue-800">Cálculos aplicados</h3>
                </div>
                <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                  <li>Os percentuais de desconto (retirada, à vista e meia nota) são subtraídos do preço unitário do produto</li>
                  <li>A substituição tributária é um acréscimo que é somado após a aplicação dos descontos</li>
                  <li>O valor das taxas de entrega é somado ao valor total do pedido</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DiscountManagement;
