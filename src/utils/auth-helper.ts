
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper function to register a user in both the Supabase auth system and custom users table
 */
export const registerUser = async ({
  username,
  password,
  name,
  email,
  userTypeId
}: {
  username: string;
  password: string;
  name: string;
  email?: string;
  userTypeId: string;
}) => {
  try {
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: username, // Using username as email for auth
      password: password,
    });

    if (authError) throw authError;
    
    if (!authData.user) {
      throw new Error('Falha ao criar usuário na autenticação');
    }

    // Then store the user in our custom users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id, // Use the Supabase auth ID
        username,
        name,
        email: email || null,
        password, // Note: You may want to hash this or remove it if using Supabase auth
        user_type_id: userTypeId,
        is_active: true,
      });

    if (userError) throw userError;

    return { success: true, userId: authData.user.id };
  } catch (error: any) {
    console.error('Error registering user:', error);
    return { success: false, error: error.message };
  }
};
