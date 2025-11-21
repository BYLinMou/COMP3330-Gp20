import { supabase } from './supabase';

// In-memory cache for OpenAI config
// This ensures data is cleared when the app is closed or user logs out
let cachedConfig: OpenAIConfig | null = null;

export interface OpenAIConfig {
  apiUrl: string;
  apiKey: string;
  receiptModel: string;
  chatModel: string;
  fallbackModel: string;
  userId: string; // 添加用户ID字段
  // Backward compatibility
  primaryModel?: string;
}

export interface OpenAIModel {
  id: string;
  created: number;
  owned_by: string;
}

/**
 * Save OpenAI configuration to local storage and Supabase
 */
export async function saveOpenAIConfig(config: Omit<OpenAIConfig, 'userId'>): Promise<void> {
  console.log('[openai-config] saveOpenAIConfig called with:', {
    ...config,
    apiKey: '***HIDDEN***'
  });
  
  try {
    // Get current user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('[openai-config] Auth error:', authError);
      throw new Error('Not authenticated');
    }
    if (!user) {
      throw new Error('No authenticated user');
    }

    const configWithUserId: OpenAIConfig = {
      ...config,
      userId: user.id
    };

    console.log('[openai-config] Saving to in-memory cache...');
    // Save config to in-memory cache
    cachedConfig = configWithUserId;
    console.log('[openai-config] Successfully saved to in-memory cache');
    
    // Then sync to Supabase
    console.log('[openai-config] Starting Supabase sync...');
    await syncConfigToSupabase(configWithUserId);
    console.log('[openai-config] Supabase sync completed');
  } catch (error) {
    console.error('[openai-config] Failed to save OpenAI config:', error);
    throw new Error('Failed to save configuration');
  }
}

/**
 * Sync configuration to Supabase
 */
async function syncConfigToSupabase(config: OpenAIConfig): Promise<void> {
  try {
    console.log('[DEBUG] Starting Supabase sync...');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[DEBUG] User data:', user ? `User ID: ${user.id}` : 'No user');
    
    if (authError) {
      console.error('[DEBUG] Auth error:', authError);
      return;
    }
    
    if (!user) {
      console.warn('[DEBUG] No authenticated user, skipping Supabase sync');
      return;
    }

    // Check if config already exists for this user
    console.log('[DEBUG] Checking existing config...');
    const { data: existing, error: selectError } = await supabase
      .from('api')
      .select('id')
      .eq('id', user.id)
      .single();
    
    console.log('[DEBUG] Existing config:', existing);
    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      console.error('[DEBUG] Select error:', selectError);
    }

    const configData = {
      id: user.id,
      url: config.apiUrl,
      key: config.apiKey,
      receipt_key: config.receiptModel,
      chat_model: config.chatModel,
      fallback_model: config.fallbackModel,
    };
    
    console.log('[DEBUG] Config data to save:', {
      ...configData,
      key: '***HIDDEN***' // Hide sensitive data in logs
    });

    if (existing) {
      // Update existing config
      console.log('[DEBUG] Updating existing config...');
      const { data, error } = await supabase
        .from('api')
        .update(configData)
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('[DEBUG] Update error:', error);
        throw error;
      }
      console.log('[DEBUG] Update result:', data);
    } else {
      // Insert new config
      console.log('[DEBUG] Inserting new config...');
      const { data, error } = await supabase
        .from('api')
        .insert(configData)
        .select();

      if (error) {
        console.error('[DEBUG] Insert error:', error);
        throw error;
      }
      console.log('[DEBUG] Insert result:', data);
    }

    console.log('✅ Config synced to Supabase');
  } catch (error) {
    console.error('[DEBUG] Failed to sync config to Supabase:', error);
    if (error instanceof Error) {
      console.error('[DEBUG] Error message:', error.message);
      console.error('[DEBUG] Error stack:', error.stack);
    }
    // Don't throw - local save already succeeded
  }
}

/**
 * Get OpenAI configuration from local storage, with Supabase fallback
 * Validates that the cached config belongs to the current user
 */
export async function getOpenAIConfig(): Promise<OpenAIConfig | null> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('[openai-config] No authenticated user');
      return null;
    }

    // Check if cached user ID matches current user
    if (cachedConfig && cachedConfig.userId === user.id) {
      return cachedConfig;
    }

    // If not in cache or user changed, fetch from Supabase
    console.log('[openai-config] Fetching from Supabase...');
    const supabaseConfig = await fetchConfigFromSupabase();
    
    if (supabaseConfig) {
      // Save to in-memory cache
      cachedConfig = supabaseConfig;
      return supabaseConfig;
    }

    return null;
  } catch (error) {
    console.error('[openai-config] Failed to get OpenAI config:', error);
    return null;
  }
}

/**
 * Fetch configuration from Supabase
 */
async function fetchConfigFromSupabase(): Promise<OpenAIConfig | null> {
  try {
    console.log('[DEBUG] Fetching config from Supabase...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[DEBUG] User for fetch:', user ? `User ID: ${user.id}` : 'No user');
    
    if (authError) {
      console.error('[DEBUG] Auth error during fetch:', authError);
      return null;
    }
    
    if (!user) return null;

    const { data, error } = await supabase
      .from('api')
      .select('url, key, receipt_key, chat_model, fallback_model')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[DEBUG] Fetch error:', error);
      return null;
    }
    
    if (!data) {
      console.log('[DEBUG] No config found in Supabase');
      return null;
    }

    console.log('[DEBUG] Config fetched from Supabase:', {
      ...data,
      key: '***HIDDEN***'
    });

    return {
      apiUrl: data.url,
      apiKey: data.key,
      receiptModel: data.receipt_key,
      chatModel: data.chat_model,
      fallbackModel: data.fallback_model,
      userId: user.id, // 添加用户ID
    };
  } catch (error) {
    console.error('[DEBUG] Failed to fetch config from Supabase:', error);
    return null;
  }
}

/**
 * Clear OpenAI configuration from both local storage and Supabase
 */
export async function clearOpenAIConfig(): Promise<void> {
  try {
    // Clear in-memory cache
    cachedConfig = null;
    
    // Clear from Supabase
    await clearConfigFromSupabase();
  } catch (error) {
    console.error('Failed to clear OpenAI config:', error);
    throw new Error('Failed to clear configuration');
  }
}

/**
 * Clear configuration from Supabase
 */
async function clearConfigFromSupabase(): Promise<void> {
  try {
    console.log('[DEBUG] Clearing config from Supabase...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[DEBUG] User for clear:', user ? `User ID: ${user.id}` : 'No user');
    
    if (authError) {
      console.error('[DEBUG] Auth error during clear:', authError);
      return;
    }
    
    if (!user) return;

    const { error } = await supabase
      .from('api')
      .delete()
      .eq('id', user.id);

    if (error) {
      console.error('[DEBUG] Delete error:', error);
      throw error;
    }
    
    console.log('✅ Config cleared from Supabase');
  } catch (error) {
    console.error('[DEBUG] Failed to clear config from Supabase:', error);
    // Don't throw - local clear already succeeded
  }
}

/**
 * Test OpenAI API connection and fetch available models list
 */
export async function fetchOpenAIModels(apiUrl: string, apiKey: string): Promise<OpenAIModel[]> {
  try {
    // Ensure URL format is correct
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const modelsEndpoint = `${baseUrl}/models`;

    const response = await fetch(modelsEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // OpenAI API response format: { data: [...], object: "list" }
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    throw new Error('Invalid API response format');
  } catch (error: any) {
    console.error('Failed to fetch OpenAI models:', error);
    throw new Error(error.message || 'Failed to connect to OpenAI API');
  }
}

/**
 * Validate OpenAI API configuration
 */
export async function validateOpenAIConfig(apiUrl: string, apiKey: string): Promise<boolean> {
  try {
    await fetchOpenAIModels(apiUrl, apiKey);
    return true;
  } catch (error) {
    return false;
  }
}
