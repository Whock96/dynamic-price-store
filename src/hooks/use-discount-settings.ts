
// Create or update the use-discount-settings.ts hook to include the missing discountOptions type

import { useState, useEffect } from 'react';
import { DiscountOption } from '@/types/types';

export interface DiscountSettings {
  deliveryFees: {
    capital: number;
    interior: number;
  };
  ipiRate: number;
  discountOptions: DiscountOption[]; // Add this missing property
}

export const useDiscountSettings = () => {
  const [settings, setSettings] = useState<DiscountSettings>({
    deliveryFees: {
      capital: 0,
      interior: 0,
    },
    ipiRate: 10,
    discountOptions: [],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // Simulated API call to fetch settings
        // Replace with your actual data fetching logic
        const mockSettings = {
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
          ] as DiscountOption[],
        };
        
        setSettings(mockSettings);
      } catch (err) {
        console.error('Error fetching discount settings:', err);
        setError('Failed to load discount settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  return { settings, isLoading, error };
};
