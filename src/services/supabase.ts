import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('No authenticated user found, using local storage mode');
      // Return a mock user for local storage mode
      return {
        id: 'local-user',
        email: 'local@demo.com',
        created_at: new Date().toISOString(),
      };
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    // Fallback: return mock user for local storage mode
    console.log('Using local storage mode as fallback...');
    return {
      id: 'local-user',
      email: 'local@demo.com',
      created_at: new Date().toISOString(),
    };
  }
};

// Helper function to create a guest user for demo purposes
export const createGuestUser = async () => {
  try {
    console.log('Creating guest user...');
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      console.error('Error creating guest user:', error);
      return null;
    }
    
    console.log('Guest user created successfully:', data.user?.id);
    return data.user;
  } catch (error) {
    console.error('Exception creating guest user:', error);
    return null;
  }
};