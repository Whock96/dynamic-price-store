
// Helper function to prepare records for Supabase
export const prepareRecordForSupabase = (record: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = { ...record };
  
  // Handle common conversions
  if (result.createdAt !== undefined && result.created_at === undefined) {
    result.created_at = result.createdAt instanceof Date 
      ? result.createdAt.toISOString() 
      : result.createdAt;
    delete result.createdAt;
  }
  
  if (result.updatedAt !== undefined && result.updated_at === undefined) {
    result.updated_at = result.updatedAt instanceof Date 
      ? result.updatedAt.toISOString() 
      : result.updatedAt;
    delete result.updatedAt;
  }
  
  // Handle table-specific conversions
  if (result.salesPersonId !== undefined) {
    result.sales_person_id = result.salesPersonId;
    delete result.salesPersonId;
  }
  
  if (result.companyName !== undefined) {
    result.company_name = result.companyName;
    delete result.companyName;
  }
  
  if (result.zipCode !== undefined) {
    result.zip_code = result.zipCode;
    delete result.zipCode;
  }
  
  if (result.noNumber !== undefined) {
    result.no_number = result.noNumber;
    delete result.noNumber;
  }
  
  if (result.defaultDiscount !== undefined) {
    result.default_discount = result.defaultDiscount;
    delete result.defaultDiscount;
  }
  
  if (result.maxDiscount !== undefined) {
    result.max_discount = result.maxDiscount;
    delete result.maxDiscount;
  }
  
  if (result.stateRegistration !== undefined) {
    result.state_registration = result.stateRegistration;
    delete result.stateRegistration;
  }
  
  if (result.quantityPerVolume !== undefined) {
    result.quantity_per_volume = result.quantityPerVolume;
    delete result.quantityPerVolume;
  }
  
  if (result.cubicVolume !== undefined) {
    result.cubic_volume = result.cubicVolume;
    delete result.cubicVolume;
  }
  
  if (result.categoryId !== undefined) {
    result.category_id = result.categoryId;
    delete result.categoryId;
  }
  
  if (result.subcategoryId !== undefined) {
    result.subcategory_id = result.subcategoryId;
    delete result.subcategoryId;
  }
  
  if (result.imageUrl !== undefined) {
    result.image_url = result.imageUrl;
    delete result.imageUrl;
  }
  
  if (result.listPrice !== undefined) {
    result.list_price = result.listPrice;
    delete result.listPrice;
  }
  
  if (result.transportCompanyId !== undefined) {
    result.transport_company_id = result.transportCompanyId;
    delete result.transportCompanyId;
  }
  
  // Ensure timestamps are set
  if (!result.created_at && result.id === undefined) {
    result.created_at = new Date().toISOString();
  }
  
  if (!result.updated_at) {
    result.updated_at = new Date().toISOString();
  }
  
  // Never send an empty ID, let Supabase generate one
  if (result.id === undefined || result.id === null || result.id === '') {
    delete result.id;
  }
  
  return result;
};
