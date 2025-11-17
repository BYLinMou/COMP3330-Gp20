/**
 * 收据处理器 - 完整流程
 * 
 * 这个文件负责处理从图片上传到最终结构化数据的完整流程
 * 架构设计：
 * 1. OCR 层（预留接口，暂未实现）
 * 2. 多模态 LLM 直接分析层（当前使用）
 * 3. 数据清洗和验证层
 */

import { Platform } from 'react-native';
import { getOpenAIConfig } from './openai-config';
import { getCategories } from './categories';

/**
 * 收据数据结构
 */
export interface ReceiptData {
  merchant: string;        // 商家名称
  amount: number;          // 金额（总额）
  date?: string;           // 交易日期 (ISO 格式 YYYY-MM-DD)
  items?: string[];        // 购买项目列表
  description?: string;    // 描述
  category?: string;       // 分类建议
  isNewCategory?: boolean; // 是否是新分类建议（不在现有分类列表中）
}

/**
 * OCR 识别结果（预留接口）
 */
export interface OCRResult {
  rawText: string;         // 识别的原始文本
  confidence?: number;     // 置信度 (0-1)
  language?: string;       // 识别的语言
}

/**
 * 处理进度回调
 */
export interface ProcessingProgress {
  step: 'converting' | 'ocr' | 'analyzing' | 'parsing' | 'complete';
  message: string;
  progress: number; // 0-100
}

/**
 * ============================================================
 * 步骤 1: 图片转 Base64
 * ============================================================
 * 
 * 平台兼容性说明：
 * - Web: 使用 Fetch API + FileReader
 * - Android: 使用 expo-file-system，支持 file:// 和 content:// URI
 * - iOS: 使用 expo-file-system，支持 file:// URI
 */
async function convertImageToBase64(imageUri: string): Promise<string> {
  try {
    console.log('[Receipt Processor] ===== Image Conversion Start =====');
    console.log('[Receipt Processor] Platform:', Platform.OS);
    console.log('[Receipt Processor] Original URI:', imageUri);
    
    // Web 平台使用 Fetch API + FileReader
    if (Platform.OS === 'web') {
      try {
        console.log('[Receipt Processor] Using web conversion method');
        const response = await fetch(imageUri);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('[Receipt Processor] Blob size:', blob.size, 'bytes');
        console.log('[Receipt Processor] Blob type:', blob.type);
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            // Remove data:image/...;base64, prefix
            const base64 = base64data.split(',')[1];
            console.log('[Receipt Processor] ✅ Image converted to base64 (web), size:', base64.length);
            resolve(base64);
          };
          reader.onerror = (error) => {
            console.error('[Receipt Processor] FileReader error:', error);
            reject(new Error('Failed to read image as base64'));
          };
          reader.readAsDataURL(blob);
        });
      } catch (error: any) {
        console.error('[Receipt Processor] ❌ Web conversion failed:', error);
        throw new Error(`Failed to read image file on web: ${error.message}`);
      }
    }
    
    // Native 平台 (Android & iOS) 使用 expo-file-system
    console.log('[Receipt Processor] Using native conversion method');
    
    try {
      const FileSystem = require('expo-file-system');
      
      // 验证 FileSystem 模块加载成功
      if (!FileSystem || !FileSystem.readAsStringAsync) {
        throw new Error('expo-file-system module not properly loaded');
      }
      
      // expo-file-system 需要完整的 URI
      // Android: 支持 file:// 和 content:// (从图库选择时)
      // iOS: 支持 file://
      let normalizedUri = imageUri;
      
      // 确保 URI 格式正确
      if (Platform.OS === 'android') {
        // Android: content:// URIs 可以直接使用，file:// URIs 也可以
        if (!normalizedUri.startsWith('file://') && !normalizedUri.startsWith('content://')) {
          normalizedUri = `file://${normalizedUri}`;
        }
      } else if (Platform.OS === 'ios') {
        // iOS: 需要 file:// 前缀
        if (!normalizedUri.startsWith('file://')) {
          normalizedUri = `file://${normalizedUri}`;
        }
      }
      
      console.log('[Receipt Processor] Normalized URI:', normalizedUri);
      
      // 读取文件为 base64
      const base64 = await FileSystem.readAsStringAsync(normalizedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('[Receipt Processor] ✅ Image converted to base64 (native), size:', base64.length);
      return base64;
      
    } catch (error: any) {
      console.error('[Receipt Processor] ❌ Native conversion failed:', error);
      console.error('[Receipt Processor] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      
      // 提供更有帮助的错误信息
      if (error.message?.includes('no such file')) {
        throw new Error('Image file not found. Please try selecting the image again.');
      } else if (error.message?.includes('permission')) {
        throw new Error('Permission denied. Please allow file access in your device settings.');
      } else if (error.message?.includes('not properly loaded')) {
        throw new Error('File system module not available. Please restart the app.');
      } else {
        throw new Error(`Failed to read image file: ${error.message || 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error('[Receipt Processor] ===== Image Conversion Failed =====');
    throw error;
  }
}

/**
 * ============================================================
 * 步骤 2: OCR 识别（预留接口，暂不实现）
 * ============================================================
 * 
 * 未来可以在这里集成：
 * - Tesseract.js (开源 OCR)
 * - Google Vision API
 * - AWS Textract
 * - Azure Computer Vision
 * 
 * 目前跳过此步骤，直接使用多模态 LLM
 */
async function performOCR(imageBase64: string): Promise<OCRResult> {
  console.log('[Receipt Processor] OCR step - Currently skipped, using multimodal LLM instead');
  
  // TODO: 实现 OCR 逻辑
  // 示例接口：
  // const result = await someOCRService.recognize(imageBase64);
  // return {
  //   rawText: result.text,
  //   confidence: result.confidence,
  //   language: result.language
  // };
  
  return {
    rawText: '', // OCR 暂未实现，返回空
    confidence: 0,
  };
}

/**
 * ============================================================
 * 步骤 3: 使用多模态 LLM 直接分析收据图片
 * ============================================================
 */
async function analyzeReceiptWithMultimodalLLM(
  imageBase64: string,
  existingCategories: string[]
): Promise<ReceiptData> {
  try {
    // 从 settings 读取用户配置
    const config = await getOpenAIConfig();
    
    if (!config) {
      throw new Error('OpenAI is not configured. Please go to Settings and configure your API.');
    }

    const { apiUrl, apiKey, primaryModel } = config;
    
    console.log('[Receipt Processor] Using model:', primaryModel);
    console.log('[Receipt Processor] API URL:', apiUrl);

    // 构建 API 请求
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const endpoint = `${baseUrl}/chat/completions`;

    // 构建 prompt - 要求 LLM 直接从图片中提取信息
    const categoryList = existingCategories.length > 0 
      ? existingCategories.join(', ') 
      : 'No existing categories';
    
    const systemPrompt = `You are a receipt analysis expert. Analyze the receipt image and extract key information.

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "merchant": "store or restaurant name",
  "amount": 0.00,
  "date": "YYYY-MM-DD",
  "items": ["item1", "item2"],
  "description": "brief description",
  "category": "category name",
  "isNewCategory": false
}

Rules:
- merchant: Extract the store/restaurant name from the receipt
- amount: Extract the TOTAL amount as a number (not a string)
- date: Convert to YYYY-MM-DD format. If not found, use today's date
- items: List of purchased items. If unclear, use empty array []
- description: Brief summary of what was purchased
- category: Choose from existing categories or suggest a new one
  * Existing categories: ${categoryList}
  * If a good match exists, use it exactly as shown
  * If no good match exists, suggest a NEW category name that fits the purchase
- isNewCategory: Set to true if you suggested a new category, false if using an existing one

Do NOT include any explanation or markdown. Return ONLY the JSON object.`;

    const requestBody = {
      model: primaryModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this receipt image and extract the information as JSON.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.3, // 低温度以获得更稳定的输出
      max_tokens: 1000,
    };

    console.log('[Receipt Processor] Sending request to LLM...');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Receipt Processor] API Error:', errorText);
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('[Receipt Processor] LLM Response:', data);

    // 提取响应内容
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in API response');
    }

    // 解析 JSON（处理可能的 markdown 包装）
    const parsedData = parseJSONFromResponse(content);
    
    // 验证和清洗数据
    const cleanedData = sanitizeReceiptData(parsedData, existingCategories);
    
    console.log('[Receipt Processor] Final receipt data:', cleanedData);
    return cleanedData;

  } catch (error: any) {
    console.error('[Receipt Processor] Analysis failed:', error);
    throw new Error(error.message || 'Failed to analyze receipt with AI');
  }
}

/**
 * ============================================================
 * 辅助函数：从 LLM 响应中提取 JSON
 * ============================================================
 */
function parseJSONFromResponse(content: string): any {
  try {
    // 尝试直接解析
    return JSON.parse(content);
  } catch {
    // 如果失败，尝试从 markdown 代码块中提取
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                      content.match(/```\s*([\s\S]*?)\s*```/) ||
                      content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    
    throw new Error('Could not extract JSON from response');
  }
}

/**
 * ============================================================
 * 辅助函数：清洗和验证收据数据
 * ============================================================
 */
function sanitizeReceiptData(data: any, existingCategories: string[]): ReceiptData {
  // 确保所有必需字段存在且格式正确
  const category = String(data.category || 'Other').trim();
  const isNewCategory = data.isNewCategory === true || !existingCategories.includes(category);
  
  return {
    merchant: String(data.merchant || 'Unknown Merchant').trim(),
    amount: Math.max(0, Number(data.amount) || 0),
    date: data.date ? formatDateISO(data.date) : formatDateISO(new Date().toISOString()),
    items: Array.isArray(data.items) 
      ? data.items.filter((item: any) => item && String(item).trim()) 
      : [],
    description: String(data.description || '').trim(),
    category: category,
    isNewCategory: isNewCategory,
  };
}

/**
 * ============================================================
 * 辅助函数：格式化日期为 ISO 格式
 * ============================================================
 */
function formatDateISO(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * ============================================================
 * 主函数：处理收据图片（完整流程）
 * ============================================================
 * 
 * @param imageUri - 图片的本地 URI
 * @param onProgress - 可选的进度回调函数
 * @returns 结构化的收据数据
 * 
 * 使用示例：
 * ```typescript
 * import { processReceiptImage } from '@/src/services/receipt-processor';
 * 
 * try {
 *   const receiptData = await processReceiptImage(imageUri, (progress) => {
 *     console.log(`${progress.step}: ${progress.message} (${progress.progress}%)`);
 *   });
 *   
 *   // 使用收据数据
 *   setAmount(receiptData.amount.toString());
 *   setMerchant(receiptData.merchant);
 *   // ...
 * } catch (error) {
 *   Alert.alert('Error', error.message);
 * }
 * ```
 */
export async function processReceiptImage(
  imageUri: string,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<ReceiptData> {
  try {
    console.log('[Receipt Processor] ===== Starting receipt processing =====');
    console.log('[Receipt Processor] Image URI:', imageUri);

    // 步骤 1: 转换图片为 Base64
    onProgress?.({
      step: 'converting',
      message: 'Converting image...',
      progress: 10,
    });
    const base64Image = await convertImageToBase64(imageUri);

    // 步骤 2: OCR（当前跳过）
    onProgress?.({
      step: 'ocr',
      message: 'OCR processing (skipped)...',
      progress: 30,
    });
    // const ocrResult = await performOCR(base64Image); // 暂时跳过

    // 步骤 3: 获取现有分类列表
    let existingCategories: string[] = [];
    try {
      const categories = await getCategories();
      existingCategories = categories.map(c => c.name);
      console.log('[Receipt Processor] Loaded existing categories:', existingCategories);
    } catch (error) {
      console.warn('[Receipt Processor] Failed to load categories, proceeding without them:', error);
    }

    // 步骤 4: 使用多模态 LLM 直接分析
    onProgress?.({
      step: 'analyzing',
      message: 'Analyzing receipt with AI...',
      progress: 50,
    });
    const receiptData = await analyzeReceiptWithMultimodalLLM(base64Image, existingCategories);

    // 步骤 5: 完成
    onProgress?.({
      step: 'complete',
      message: 'Processing complete!',
      progress: 100,
    });

    console.log('[Receipt Processor] ===== Processing complete =====');
    return receiptData;

  } catch (error: any) {
    console.error('[Receipt Processor] ===== Processing failed =====');
    console.error('[Receipt Processor] Error:', error);
    
    // 提供更友好的错误信息
    if (error.message.includes('not configured')) {
      throw new Error('Please configure OpenAI API in Settings first');
    } else if (error.message.includes('API request failed')) {
      throw new Error('Failed to connect to AI service. Please check your API settings.');
    } else {
      throw new Error(error.message || 'Failed to process receipt');
    }
  }
}

/**
 * ============================================================
 * 导出类型和主函数
 * ============================================================
 */
