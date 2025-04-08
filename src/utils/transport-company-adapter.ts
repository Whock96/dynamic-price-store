
import { Tables } from "@/integrations/supabase/client";
import { TransportCompany } from "@/types/types";

/**
 * Converts a Supabase transport company record to application format
 */
export const supabaseToTransportCompany = (data: Tables<'transport_companies'>): TransportCompany => {
  if (!data) {
    throw new Error('Transport company data is null or undefined');
  }
  
  return {
    id: data.id,
    name: data.name,
    document: data.document,
    email: data.email || '',
    phone: data.phone || '',
    whatsapp: data.whatsapp || '',
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
};

/**
 * Converts application transport company to Supabase format
 */
export const transportCompanyToSupabase = (
  company: Partial<TransportCompany>
): Partial<Tables<'transport_companies'>> => {
  const result: Partial<Tables<'transport_companies'>> = {};
  
  if ('name' in company) result.name = company.name;
  if ('document' in company) result.document = company.document;
  if ('email' in company) result.email = company.email;
  if ('phone' in company) result.phone = company.phone;
  if ('whatsapp' in company) result.whatsapp = company.whatsapp;
  
  // Add timestamps if needed
  if ('createdAt' in company) {
    result.created_at = company.createdAt instanceof Date 
      ? company.createdAt.toISOString() 
      : company.createdAt?.toString();
  }
  
  if ('updatedAt' in company) {
    result.updated_at = company.updatedAt instanceof Date 
      ? company.updatedAt.toISOString() 
      : company.updatedAt?.toString();
  }
  
  return result;
};
