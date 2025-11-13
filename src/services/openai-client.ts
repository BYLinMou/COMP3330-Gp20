import { getOpenAIConfig } from './openai-config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 发送聊天请求到 OpenAI API
 * 自动使用用户配置的 API URL 和 Key
 * 如果主模型失败，会尝试使用备用模型
 */
export async function sendChatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const config = await getOpenAIConfig();
  
  if (!config) {
    throw new Error('OpenAI is not configured. Please configure it in Settings.');
  }

  const { apiUrl, apiKey, primaryModel, fallbackModel } = config;

  // 首先尝试使用主模型
  try {
    return await makeRequest(apiUrl, apiKey, primaryModel, request);
  } catch (error) {
    console.warn('Primary model failed, trying fallback model...', error);
    
    // 如果主模型失败且有备用模型，尝试备用模型
    if (fallbackModel) {
      try {
        return await makeRequest(apiUrl, apiKey, fallbackModel, request);
      } catch (fallbackError) {
        console.error('Fallback model also failed:', fallbackError);
        throw new Error('Both primary and fallback models failed');
      }
    }
    
    throw error;
  }
}

async function makeRequest(
  apiUrl: string,
  apiKey: string,
  model: string,
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const endpoint = `${baseUrl}/chat/completions`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      ...request,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * 使用示例：
 * 
 * import { sendChatCompletion } from '@/src/services/openai-client';
 * 
 * const response = await sendChatCompletion({
 *   messages: [
 *     { role: 'system', content: 'You are a helpful assistant.' },
 *     { role: 'user', content: 'Hello!' }
 *   ],
 *   temperature: 0.7,
 *   max_tokens: 500
 * });
 * 
 * console.log(response.choices[0].message.content);
 */
