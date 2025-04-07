
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

/**
 * Helper function to synchronize an existing user in the custom users table with Supabase Auth
 */
export const syncUserWithAuth = async (username: string, password: string) => {
  try {
    // Create the auth user with the same credentials from the custom users table
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: username, // Using username as email for auth
      password: password,
    });

    if (authError) throw authError;
    
    if (!authData.user) {
      throw new Error('Falha ao sincronizar usuário com autenticação');
    }

    // Update the user in our custom users table with the auth user ID
    const { error: userError } = await supabase
      .from('users')
      .update({ id: authData.user.id })
      .eq('username', username);

    if (userError) throw userError;

    return { success: true, userId: authData.user.id };
  } catch (error: any) {
    console.error('Error syncing user with auth:', error);
    return { success: false, error: error.message };
  }
};
