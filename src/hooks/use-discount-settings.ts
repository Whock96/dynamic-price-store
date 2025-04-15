
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface DiscountSettings {
  pickup: number;
  cashPayment: number;
  halfInvoice: number;
  taxSubstitution: number;
  deliveryFees: {
    capital: number;
    interior: number;
  }
  ipiRate: number;
}

// Default values
const DEFAULT_SETTINGS: DiscountSettings = {
  pickup: 1,
  cashPayment: 1,
  halfInvoice: 3,
  taxSubstitution: 20,
  deliveryFees: {
    capital: 25,
    interior: 50
  },
  ipiRate: 10
};

// LocalStorage key
const STORAGE_KEY = 'discount_settings';

export const useDiscountSettings = () => {
  const [settings, setSettings] = useState<DiscountSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from both localStorage and Supabase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // First, try to fetch from Supabase
        const { data, error } = await supabase
          .from('discount_settings')
          .select('*')
          .single();

        if (error || !data) {
          console.warn('Error fetching settings from Supabase, falling back to localStorage');
          // Fallback to localStorage
          const storedSettings = localStorage.getItem(STORAGE_KEY);
          if (storedSettings) {
            const parsedSettings = JSON.parse(storedSettings);
            setSettings({
              ...DEFAULT_SETTINGS,
              ...parsedSettings,
              deliveryFees: {
                ...DEFAULT_SETTINGS.deliveryFees,
                ...(parsedSettings.deliveryFees || {})
              }
            });
          }
        } else {
          // Convert Supabase data to our DiscountSettings interface
          const supabaseSettings: DiscountSettings = {
            pickup: data.pickup,
            cashPayment: data.cash_payment,
            halfInvoice: data.half_invoice,
            taxSubstitution: data.tax_substitution,
            deliveryFees: {
              capital: data.delivery_fee_capital,
              interior: data.delivery_fee_interior
            },
            ipiRate: data.ipi_rate
          };

          setSettings(supabaseSettings);
          // Also update localStorage for consistency
          localStorage.setItem(STORAGE_KEY, JSON.stringify(supabaseSettings));
        }
      } catch (error) {
        console.error('Error loading discount settings:', error);
        toast.error('Erro ao carregar configurações de desconto');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // Add event listener to detect changes in localStorage from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const parsedSettings = JSON.parse(event.newValue);
          setSettings(parsedSettings);
        } catch (error) {
          console.error('Error parsing updated settings:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Save settings to both Supabase and localStorage
  const saveSettings = async (newSettings: DiscountSettings) => {
    try {
      // Ensure all fields are present before saving
      const settingsToSave = {
        ...DEFAULT_SETTINGS,
        ...newSettings,
        deliveryFees: {
          ...DEFAULT_SETTINGS.deliveryFees,
          ...(newSettings.deliveryFees || {})
        }
      };
      
      // Update Supabase
      const { error } = await supabase
        .from('discount_settings')
        .upsert({
          // Use the first row (ID will be the same due to our SQL setup)
          id: (await supabase.from('discount_settings').select('id').single()).data?.id,
          pickup: settingsToSave.pickup,
          cash_payment: settingsToSave.cashPayment,
          half_invoice: settingsToSave.halfInvoice,
          tax_substitution: settingsToSave.taxSubstitution,
          delivery_fee_capital: settingsToSave.deliveryFees.capital,
          delivery_fee_interior: settingsToSave.deliveryFees.interior,
          ipi_rate: settingsToSave.ipiRate
        })
        .select();

      if (error) throw error;
      
      // Update localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
      
      // Update local state
      setSettings(settingsToSave);
      
      // Dispatch a custom event to notify other components about the change
      const event = new CustomEvent('discount-settings-changed', { 
        detail: { settings: settingsToSave } 
      });
      window.dispatchEvent(event);
      
      toast.success('Configurações de descontos salvas com sucesso');
      return true;
    } catch (error) {
      console.error('Error saving discount settings:', error);
      toast.error('Erro ao salvar configurações de descontos');
      return false;
    }
  };

  // Update specific setting
  const updateSetting = (key: keyof DiscountSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    return saveSettings(newSettings);
  };

  // Update delivery fee
  const updateDeliveryFee = (location: 'capital' | 'interior', value: number) => {
    const newDeliveryFees = { ...settings.deliveryFees, [location]: value };
    const newSettings = { ...settings, deliveryFees: newDeliveryFees };
    return saveSettings(newSettings);
  };

  // Reset to default settings
  const resetSettings = () => {
    return saveSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    isLoading,
    updateSetting,
    updateDeliveryFee,
    resetSettings,
    saveSettings
  };
};

