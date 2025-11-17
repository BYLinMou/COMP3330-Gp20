import { getOpenAIConfig } from './openai-config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  tool_calls?: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }[];
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: {
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: any;
    };
  }[];
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
 * Send chat completion request to OpenAI API
 * Automatically uses the user-configured API URL and Key
 * If the specified model fails, tries to use the fallback model
 */
export async function sendChatCompletion(
  request: ChatCompletionRequest,
  modelType?: 'chat' | 'receipt'
): Promise<ChatCompletionResponse> {
  const config = await getOpenAIConfig();
  
  if (!config) {
    throw new Error('OpenAI is not configured. Please configure it in Settings.');
  }

  const { apiUrl, apiKey, chatModel, receiptModel, fallbackModel } = config;

  // Based on model type, select the primary model, default to chat model
  const primaryModel = modelType === 'receipt' ? receiptModel : chatModel;

  // First try using the specified primary model
  try {
    return await makeRequest(apiUrl, apiKey, primaryModel, request);
  } catch (error) {
    console.warn(`${modelType || 'chat'} model failed, trying fallback model...`, error);
    
    // If primary model fails and there is a fallback model, try the fallback model
    if (fallbackModel) {
      try {
        return await makeRequest(apiUrl, apiKey, fallbackModel, request);
      } catch (fallbackError) {
        console.error('Fallback model also failed:', fallbackError);
        throw new Error(`Both primary and fallback models failed`);
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
 * Usage example:
 * 
 * import { sendChatCompletion } from '@/src/services/openai-client';
 * 
 * // Use chat model (default)
 * const chatResponse = await sendChatCompletion({
 *   messages: [
 *     { role: 'system', content: 'You are a helpful assistant.' },
 *     { role: 'user', content: 'Hello!' }
 *   ],
 *   temperature: 0.7,
 *   max_tokens: 500
 * });
 * console.log(chatResponse.choices[0].message.content);
 * 
 * // Use receipt model
 * const receiptResponse = await sendChatCompletion({
 *   messages: [
 *     { role: 'system', content: 'Analyze this receipt...' },
 *     { role: 'user', content: 'Process this receipt data' }
 *   ]
 * }, 'receipt');
 * console.log(receiptResponse.choices[0].message.content);
 */
