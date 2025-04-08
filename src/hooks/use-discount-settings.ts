
import { useState, useEffect } from 'react';
import { DiscountOption } from '@/types/types';
import { toast } from 'sonner';

export interface DiscountSettings {
  deliveryFees: {
    capital: number;
    interior: number;
  };
  ipiRate: number;
  discountOptions: DiscountOption[];
  // Additional fields needed by DiscountManagement.tsx
  pickup: number;
  cashPayment: number;
  halfInvoice: number;
  taxSubstitution: number;
}

const DEFAULT_SETTINGS: DiscountSettings = {
  deliveryFees: {
    capital: 20,
    interior: 35,
  },
  ipiRate: 10,
  discountOptions: [
    {
      id: '1',
      name: 'Retirada',
      description: 'Cliente retira na empresa',
      value: 5,
      type: 'discount',
      isActive: true,
    },
    {
      id: '2',
      name: 'Meia Nota',
      description: 'Emissão parcial de nota fiscal',
      value: 0,
      type: 'discount',
      isActive: true,
    },
    {
      id: '3',
      name: 'Substituição Tributária',
      description: 'Aplicar taxa de substituição tributária',
      value: 18,
      type: 'surcharge',
      isActive: true,
    },
    {
      id: '4',
      name: 'À vista',
      description: 'Pagamento à vista',
      value: 3,
      type: 'discount',
      isActive: true,
    },
  ],
  pickup: 5,
  cashPayment: 3,
  halfInvoice: 0,
  taxSubstitution: 18
};

export const useDiscountSettings = () => {
  const [settings, setSettings] = useState<DiscountSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateSetting = (key: keyof DiscountSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    return true;
  };

  const updateDeliveryFee = (location: 'capital' | 'interior', value: number) => {
    setSettings(prev => ({
      ...prev,
      deliveryFees: {
        ...prev.deliveryFees,
        [location]: value
      }
    }));
    return true;
  };

  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    toast.success('Configurações restauradas com sucesso!');
    return true;
  };

  const saveSettings = async (updatedSettings: Partial<DiscountSettings>) => {
    try {
      // In a real app, this would save to the backend
      setSettings(prev => ({
        ...prev,
        ...updatedSettings
      }));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // Simulate API call with a timeout
        setTimeout(() => {
          setSettings(DEFAULT_SETTINGS);
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching discount settings:', err);
        setError('Failed to load discount settings');
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  return { 
    settings, 
    isLoading, 
    error, 
    updateSetting, 
    updateDeliveryFee, 
    resetSettings, 
    saveSettings 
  };
};
