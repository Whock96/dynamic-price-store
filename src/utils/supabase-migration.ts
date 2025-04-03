
import { supabase } from "@/integrations/supabase/client";

type MigrationResult = {
  success: boolean;
  message: string;
};

// Function to execute raw SQL queries
const executeSQL = async (query: string): Promise<MigrationResult> => {
  try {
    // Since we can't directly use execute_sql RPC because it's not available,
    // let's handle this by informing the user
    console.error('Warning: execute_sql RPC function is not available in the database');
    return { success: false, message: 'Execute SQL function is not available. Please set up the database function first.' };
  } catch (error) {
    console.error('Erro ao executar migração:', error);
    return { success: false, message: `Erro: ${(error as Error).message}` };
  }
};

// Function to add a new column to a table
const addColumn = async (tableName: string, columnName: string, columnType: string): Promise<MigrationResult> => {
  try {
    const query = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnType};`;
    return executeSQL(query);
  } catch (error) {
    console.error('Erro ao adicionar coluna:', error);
    return { success: false, message: `Erro: ${(error as Error).message}` };
  }
};

// Function to rename a column in a table
const renameColumn = async (tableName: string, oldColumnName: string, newColumnName: string): Promise<MigrationResult> => {
  try {
    const query = `ALTER TABLE ${tableName} RENAME COLUMN ${oldColumnName} TO ${newColumnName};`;
    return executeSQL(query);
  } catch (error) {
    console.error('Erro ao renomear coluna:', error);
    return { success: false, message: `Erro: ${(error as Error).message}` };
  }
};

// Function to drop a column from a table
const dropColumn = async (tableName: string, columnName: string): Promise<MigrationResult> => {
  try {
    const query = `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS ${columnName};`;
    return executeSQL(query);
  } catch (error) {
    console.error('Erro ao remover coluna:', error);
    return { success: false, message: `Erro: ${(error as Error).message}` };
  }
};

// Function to create a new table
const createTable = async (tableName: string, columns: string): Promise<MigrationResult> => {
  try {
    const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns});`;
    return executeSQL(query);
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
    return { success: false, message: `Erro: ${(error as Error).message}` };
  }
};

// Function to drop a table
const dropTable = async (tableName: string): Promise<MigrationResult> => {
  try {
    const query = `DROP TABLE IF EXISTS ${tableName};`;
    return executeSQL(query);
  } catch (error) {
    console.error('Erro ao remover tabela:', error);
    return { success: false, message: `Erro: ${(error as Error).message}` };
  }
};

export const migrationSteps = {
  addMissingFieldsToCustomer: async () => {
    const tableName = 'customers';
    
    // Add 'phone' column
    const addPhoneResult = await addColumn(tableName, 'phone', 'TEXT');
    if (!addPhoneResult.success) return addPhoneResult;

    // Add 'email' column
    const addEmailResult = await addColumn(tableName, 'email', 'TEXT');
    if (!addEmailResult.success) return addEmailResult;

    // Add 'default_discount' column
    const addDefaultDiscountResult = await addColumn(tableName, 'default_discount', 'NUMERIC');
    if (!addDefaultDiscountResult.success) return addDefaultDiscountResult;

    // Add 'max_discount' column
    const addMaxDiscountResult = await addColumn(tableName, 'max_discount', 'NUMERIC');
    if (!addMaxDiscountResult.success) return addMaxDiscountResult;

    return { success: true, message: 'Campos adicionados à tabela customers com sucesso!' };
  },
  updateQuantityPerVolumeType: async () => {
    try {
      const query = `
        ALTER TABLE products 
        ALTER COLUMN quantity_per_volume TYPE numeric USING quantity_per_volume::numeric;
      `;
      
      return executeSQL(query);
    } catch (error) {
      console.error('Erro ao alterar tipo da coluna quantity_per_volume:', error);
      return { success: false, message: `Erro: ${(error as Error).message}` };
    }
  },
};

export const runMigration = async (migrationKey: keyof typeof migrationSteps): Promise<MigrationResult> => {
  if (migrationSteps[migrationKey]) {
    console.log(`Iniciando migração: ${migrationKey}`);
    try {
      const result = await migrationSteps[migrationKey]();
      console.log(`Migração ${migrationKey} concluída com resultado:`, result);
      return result;
    } catch (error) {
      console.error(`Erro ao executar a migração ${migrationKey}:`, error);
      return { success: false, message: `Erro durante a migração ${migrationKey}: ${(error as any).message}` };
    }
  } else {
    console.warn(`Migração não encontrada: ${migrationKey}`);
    return { success: false, message: `Migração não encontrada: ${migrationKey}` };
  }
};
