import AsyncStorage from '@react-native-async-storage/async-storage';

const OPENAI_CONFIG_KEY = '@openai_config';

export interface OpenAIConfig {
  apiUrl: string;
  apiKey: string;
  receiptModel: string;
  chatModel: string;
  fallbackModel: string;
  // Backward compatibility
  primaryModel?: string;
}

export interface OpenAIModel {
  id: string;
  created: number;
  owned_by: string;
}

/**
 * Save OpenAI configuration to local storage
 */
export async function saveOpenAIConfig(config: OpenAIConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(OPENAI_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save OpenAI config:', error);
    throw new Error('Failed to save configuration');
  }
}

/**
 * Get OpenAI configuration from local storage
 */
export async function getOpenAIConfig(): Promise<OpenAIConfig | null> {
  try {
    const configStr = await AsyncStorage.getItem(OPENAI_CONFIG_KEY);
    if (!configStr) return null;
    const config = JSON.parse(configStr);
    // Migration: handle old configs with primaryModel
    if (!config.receiptModel && config.primaryModel) {
      config.receiptModel = config.primaryModel;
    }
    if (!config.chatModel) {
      config.chatModel = config.primaryModel || '';
    }
    return config;
  } catch (error) {
    console.error('Failed to get OpenAI config:', error);
    return null;
  }
}

/**
 * Clear OpenAI configuration
 */
export async function clearOpenAIConfig(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OPENAI_CONFIG_KEY);
  } catch (error) {
    console.error('Failed to clear OpenAI config:', error);
    throw new Error('Failed to clear configuration');
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
