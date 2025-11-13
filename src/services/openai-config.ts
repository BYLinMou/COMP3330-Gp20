import AsyncStorage from '@react-native-async-storage/async-storage';

const OPENAI_CONFIG_KEY = '@openai_config';

export interface OpenAIConfig {
  apiUrl: string;
  apiKey: string;
  primaryModel: string;
  fallbackModel: string;
}

export interface OpenAIModel {
  id: string;
  created: number;
  owned_by: string;
}

/**
 * 保存 OpenAI 配置到本地存储
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
 * 从本地存储获取 OpenAI 配置
 */
export async function getOpenAIConfig(): Promise<OpenAIConfig | null> {
  try {
    const configStr = await AsyncStorage.getItem(OPENAI_CONFIG_KEY);
    if (!configStr) return null;
    return JSON.parse(configStr);
  } catch (error) {
    console.error('Failed to get OpenAI config:', error);
    return null;
  }
}

/**
 * 清除 OpenAI 配置
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
 * 测试 OpenAI API 连接并获取可用模型列表
 */
export async function fetchOpenAIModels(apiUrl: string, apiKey: string): Promise<OpenAIModel[]> {
  try {
    // 确保 URL 格式正确
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
    
    // OpenAI API 返回格式: { data: [...], object: "list" }
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
 * 验证 OpenAI API 配置
 */
export async function validateOpenAIConfig(apiUrl: string, apiKey: string): Promise<boolean> {
  try {
    await fetchOpenAIModels(apiUrl, apiKey);
    return true;
  } catch (error) {
    return false;
  }
}
