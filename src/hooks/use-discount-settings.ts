
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface DiscountSettings {
  pickup: number;
  cashPayment: number;
  halfInvoice: number;
  taxSubstitution: number; // This represents ICMS ST rate (not changing the field name to maintain compatibility)
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
  taxSubstitution: 20, // Changed from 7.8 to 20 (representing 20% ICMS ST)
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

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      try {
        const storedSettings = localStorage.getItem(STORAGE_KEY);
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error('Error loading discount settings:', error);
        // Fallback to default settings
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // Add event listener to detect changes in localStorage from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          setSettings(JSON.parse(event.newValue));
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

  // Save settings to localStorage and trigger an event for other components
  const saveSettings = (newSettings: DiscountSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      
      // Update local state
      setSettings(newSettings);
      
      // Dispatch a custom event to notify other components about the change
      const event = new CustomEvent('discount-settings-changed', { 
        detail: { settings: newSettings } 
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
