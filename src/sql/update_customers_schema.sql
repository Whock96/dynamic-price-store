
-- Add whatsapp column to customers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'whatsapp'
    ) THEN
        ALTER TABLE customers ADD COLUMN whatsapp TEXT;
    END IF;
END $$;

-- Add register_date column to customers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'register_date'
    ) THEN
        ALTER TABLE customers ADD COLUMN register_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Initialize register_date with created_at for existing records
UPDATE customers 
SET register_date = created_at 
WHERE register_date IS NULL;
