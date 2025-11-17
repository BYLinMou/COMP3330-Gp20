import { supabase } from './supabase';
import { getProfile, createProfile } from './profiles';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export type CategoryRealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';
export type CategoryChange = {
  eventType: CategoryRealtimeEvent;
  new?: Category | null;
  old?: Category | null;
};

/**
 * Get all categories for current user
 */
export async function getCategories() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data as Category[];
}

/**
 * Add new category; ensure profile row exists to satisfy FK
 */
export async function addCategory(name: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    await getProfile();
  } catch {
    await createProfile();
  }

  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, user_id: user.id }])
    .select()
    .single();

  if (error) {
    console.error('Error adding category:', error);
    throw error;
  }

  return data as Category;
}

/**
 * Update a category name
 */
export async function updateCategory(id: string, name: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    throw error;
  }

  return data as Category;
}

/**
 * Delete a category, nullifying references in transactions first
 */
export async function deleteCategory(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  console.log('Deleting category:', id, 'for user:', user.id);

  // First, clear category references in transactions
  const { data: txData, error: txErr, count: txCount } = await supabase
    .from('transactions')
    .update({ category_id: null })
    .eq('category_id', id)
    .eq('user_id', user.id);
  
  console.log('Transaction update result:', { txData, txErr, txCount });
  
  if (txErr) {
    console.error('Error clearing category references in transactions:', txErr);
    throw new Error(`Failed to clear category references: ${txErr.message || JSON.stringify(txErr)}`);
  }

  console.log('Successfully cleared category references, now deleting category');

  // Then delete the category
  const { data, error, count } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  console.log('Delete operation result:', { data, error, count });

  if (error) {
    console.error('Error deleting category:', error);
    throw new Error(`Failed to delete category: ${error.message || JSON.stringify(error)}`);
  }
  
  console.log('Category deleted successfully');
  return true;
}

/**
 * Subscribe to realtime changes on categories for current user
 */
export async function subscribeToCategoryChanges(
  onChange: (change: CategoryChange) => void,
  options?: { userId?: string }
) {
  const { userId } = options || {};
  const user = userId ? { id: userId } : (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const channel = supabase
    .channel(`public:categories:${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'categories',
        filter: `user_id=eq.${user.id}`,
      },
      (payload: any) => {
        onChange({
          eventType: payload.eventType as CategoryRealtimeEvent,
          new: (payload.new ?? null) as Category | null,
          old: (payload.old ?? null) as Category | null,
        });
      }
    )
    .subscribe();

  return async () => {
    try {
      await channel.unsubscribe();
    } catch (e) {
      // @ts-ignore
      supabase.removeChannel?.(channel);
    }
  };
}
