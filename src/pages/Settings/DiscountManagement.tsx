
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDiscountSettings } from '@/hooks/use-discount-settings';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FormState {
  pickup: number;
  cashPayment: number;
  halfInvoice: number;
  taxSubstitution: number;
  capitalDeliveryFee: number;
  interiorDeliveryFee: number;
  ipiRate: number;
}

const DiscountManagement = () => {
  const navigate = useNavigate();
  const { settings, updateSetting, updateDeliveryFee, resetSettings, isLoading, saveSettings } = useDiscountSettings();
  const [formData, setFormData] = useState<FormState>({
    pickup: 0,
    cashPayment: 0,
    halfInvoice: 0,
    taxSubstitution: 0,
    capitalDeliveryFee: 0,
    interiorDeliveryFee: 0,
    ipiRate: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        pickup: settings.pickup,
        cashPayment: settings.cashPayment,
        halfInvoice: settings.halfInvoice,
        taxSubstitution: settings.taxSubstitution,
        capitalDeliveryFee: settings.deliveryFees.capital,
        interiorDeliveryFee: settings.deliveryFees.interior,
        ipiRate: settings.ipiRate,
      });
      console.log('Loaded settings:', settings);
    }
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Instead of making individual updates, build the complete settings object
      const updatedSettings = {
        pickup: formData.pickup,
        cashPayment: formData.cashPayment,
        halfInvoice: formData.halfInvoice,
        taxSubstitution: formData.taxSubstitution,
        ipiRate: formData.ipiRate,
        deliveryFees: {
          capital: formData.capitalDeliveryFee,
          interior: formData.interiorDeliveryFee
        }
      };
      
      console.log('Saving settings:', updatedSettings);
      const success = await saveSettings(updatedSettings);
      
      if (success) {
        toast.success('Configurações salvas com sucesso!');
      } else {
        toast.error('Erro ao salvar as configurações.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      const success = await resetSettings();
      if (success) {
        toast.success('Configurações restauradas para os padrões!');
      } else {
        toast.error('Erro ao restaurar as configurações.');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Erro ao restaurar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Carregando configurações...</div>;
  }

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
              Configure os valores padrão para descontos, acréscimos e taxas usados no sistema
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Configurações de Descontos e Acréscimos</CardTitle>
          <CardDescription>
            Configure os valores padrão para descontos, acréscimos e taxas usados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <h3 className="text-lg font-medium">Descontos</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup">Retirada (%)</Label>
                  <Input
                    id="pickup"
                    name="pickup"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.pickup}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Desconto aplicado para clientes que retiram o produto no local
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cashPayment">A Vista (%)</Label>
                  <Input
                    id="cashPayment"
                    name="cashPayment"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.cashPayment}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Desconto aplicado para pagamentos à vista
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="halfInvoice">Meia Nota (%)</Label>
                  <Input
                    id="halfInvoice"
                    name="halfInvoice"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.halfInvoice}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Desconto aplicado para emissão de meia nota fiscal
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <h3 className="text-lg font-medium">Acréscimos</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxSubstitution">ICMS Substituição tributária (%)</Label>
                  <Input
                    id="taxSubstitution"
                    name="taxSubstitution"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.taxSubstitution}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor percentual do ICMS usado para calcular a substituição tributária
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipiRate">IPI (%)</Label>
                  <Input
                    id="ipiRate"
                    name="ipiRate"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.ipiRate}
                    onChange={handleInputChange}
                  />
                   <p className="text-xs text-muted-foreground">
                    Valor percentual do IPI (Imposto sobre Produtos Industrializados)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <h3 className="text-lg font-medium">Taxas de Entrega</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capitalDeliveryFee">Capital (R$)</Label>
                  <Input
                    id="capitalDeliveryFee"
                    name="capitalDeliveryFee"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.capitalDeliveryFee}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Taxa de entrega para a capital
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interiorDeliveryFee">Interior (R$)</Label>
                  <Input
                    id="interiorDeliveryFee"
                    name="interiorDeliveryFee"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.interiorDeliveryFee}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Taxa de entrega para o interior
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={handleReset}>
                Restaurar Padrões
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </>
                ) : 'Salvar Configurações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscountManagement;
