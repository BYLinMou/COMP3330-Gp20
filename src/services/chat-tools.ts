import { getCategories, addCategory, updateCategory, deleteCategory } from './categories';
import { getRecentTransactions, getTransactionsByDateRange, getSpendingBreakdown, getIncomeAndExpenses, addTransaction, updateTransaction, deleteTransaction, getCurrentBudget, setBudget } from './transactions';
import { getProfile } from './profiles';

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  function: (...args: any[]) => Promise<any>;
}

// Categories tools
export const categoryTools: Tool[] = [
  {
    name: 'getCategories',
    description: 'Get all categories for the current user',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    function: async () => getCategories()
  },
  {
    name: 'addCategory',
    description: 'Add a new category for the current user',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The name of the category to add'
        }
      },
      required: ['name']
    },
    function: async (args: { name: string }) => addCategory(args.name)
  },
  {
    name: 'updateCategory',
    description: 'Update an existing category name',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the category to update'
        },
        name: {
          type: 'string',
          description: 'The new name for the category'
        }
      },
      required: ['id', 'name']
    },
    function: async (args: { id: string; name: string }) => updateCategory(args.id, args.name)
  },
  {
    name: 'deleteCategory',
    description: 'Delete a category by ID or name (will nullify references in transactions first)',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the category to delete (optional, use if available)'
        },
        name: {
          type: 'string',
          description: 'The name of the category to delete (use if ID is not available)'
        }
      },
      required: []
    },
    function: async (args: { id?: string; name?: string }) => {
      let categoryId = args.id;
      
      // If both ID and name provided, verify they match
      if (args.id && args.name) {
        const categories = await getCategories();
        const categoryById = categories.find(c => c.id === args.id);
        const categoryByName = categories.find(c => c.name.toLowerCase() === args.name!.toLowerCase());
        
        if (!categoryById) {
          throw new Error(`Category with ID "${args.id}" not found`);
        }
        
        if (!categoryByName) {
          throw new Error(`Category with name "${args.name!}" not found`);
        }
        
        if (categoryById.id !== categoryByName.id) {
          throw new Error(`ID and name do not match the same category. ID refers to "${categoryById.name}" but name refers to "${categoryByName.name}"`);
        }
        
        categoryId = args.id;
      }
      // If only name provided, look it up
      else if (!categoryId && args.name) {
        const categories = await getCategories();
        const category = categories.find(c => c.name.toLowerCase() === args.name!.toLowerCase());
        
        if (!category) {
          throw new Error(`Category "${args.name!}" not found`);
        }
        
        categoryId = category.id;
      }
      
      if (!categoryId) {
        throw new Error('Either id or name must be provided');
      }
      
      return deleteCategory(categoryId);
    }
  },
  {
    name: 'addMultipleCategories',
    description: 'Add multiple categories at once',
    parameters: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Array of category names to add (e.g., ["Food", "Transport", "Entertainment"])'
        }
      },
      required: ['categories']
    },
    function: async (args: { categories: string[] }) => {
      if (!args.categories || !Array.isArray(args.categories)) {
        throw new Error('categories must be an array of strings');
      }
      const results = [];
      for (const name of args.categories) {
        try {
          const result = await addCategory(name);
          results.push({ name, success: true, result });
        } catch (error) {
          results.push({ name, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      return results;
    }
  }
];

// Transactions tools
export const transactionTools: Tool[] = [
  {
    name: 'getRecentTransactions',
    description: 'Get recent transactions for the current user',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of transactions to fetch (default: 10)',
          default: 10
        }
      },
      required: []
    },
    function: async (args: { limit?: number } = {}) => getRecentTransactions(args.limit)
  },
  {
    name: 'getTransactionsByDateRange',
    description: 'Get transactions within a specific date range',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format'
        }
      },
      required: ['startDate', 'endDate']
    },
    function: async (args: { startDate: string; endDate: string }) => 
      getTransactionsByDateRange(args.startDate, args.endDate)
  },
  {
    name: 'getSpendingBreakdown',
    description: 'Get spending breakdown by category for a date range',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format'
        }
      },
      required: ['startDate', 'endDate']
    },
    function: async (args: { startDate: string; endDate: string }) => 
      getSpendingBreakdown(args.startDate, args.endDate)
  },
  {
    name: 'getIncomeAndExpenses',
    description: 'Get total income and expenses for a date range',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format'
        }
      },
      required: ['startDate', 'endDate']
    },
    function: async (args: { startDate: string; endDate: string }) => 
      getIncomeAndExpenses(args.startDate, args.endDate)
  },
  {
    name: 'addTransaction',
    description: 'Add a new transaction',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Transaction amount (positive for income, negative for expense)'
        },
        occurred_at: {
          type: 'string',
          description: 'Date when the transaction occurred (ISO format)'
        },
        merchant: {
          type: 'string',
          description: 'Merchant name (optional)'
        },
        category_id: {
          type: 'string',
          description: 'Category ID (optional)'
        },
        note: {
          type: 'string',
          description: 'Additional note (optional)'
        },
        payment_method: {
          type: 'string',
          description: 'Payment method (optional)'
        },
        source: {
          type: 'string',
          enum: ['manual', 'ocr', 'ai'],
          description: 'Source of transaction (default: manual)'
        }
      },
      required: ['amount', 'occurred_at']
    },
    function: async (args: { amount: number; occurred_at: string; merchant?: string; category_id?: string; note?: string; payment_method?: string; source?: 'manual' | 'ocr' | 'ai' }) => {
      const transactionData: any = {
        amount: args.amount,
        occurred_at: args.occurred_at,
        source: args.source || 'manual'
      };
      if (args.merchant !== undefined) transactionData.merchant = args.merchant;
      if (args.category_id !== undefined) transactionData.category_id = args.category_id;
      if (args.note !== undefined) transactionData.note = args.note;
      if (args.payment_method !== undefined) transactionData.payment_method = args.payment_method;
      return addTransaction(transactionData);
    }
  },
  {
    name: 'updateTransaction',
    description: 'Update an existing transaction',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Transaction ID to update'
        },
        amount: {
          type: 'number',
          description: 'New transaction amount (optional)'
        },
        occurred_at: {
          type: 'string',
          description: 'New date (optional)'
        },
        merchant: {
          type: 'string',
          description: 'New merchant name (optional)'
        },
        category_id: {
          type: 'string',
          description: 'New category ID (optional)'
        },
        note: {
          type: 'string',
          description: 'New note (optional)'
        },
        payment_method: {
          type: 'string',
          description: 'New payment method (optional)'
        }
      },
      required: ['id']
    },
    function: async (args: { id: string; amount?: number; occurred_at?: string; merchant?: string; category_id?: string; note?: string; payment_method?: string }) => {
      const updates: any = {};
      if (args.amount !== undefined) updates.amount = args.amount;
      if (args.occurred_at !== undefined) updates.occurred_at = args.occurred_at;
      if (args.merchant !== undefined) updates.merchant = args.merchant;
      if (args.category_id !== undefined) updates.category_id = args.category_id;
      if (args.note !== undefined) updates.note = args.note;
      if (args.payment_method !== undefined) updates.payment_method = args.payment_method;
      return updateTransaction(args.id, updates);
    }
  },
  {
    name: 'deleteTransaction',
    description: 'Delete a transaction',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Transaction ID to delete'
        }
      },
      required: ['id']
    },
    function: async (args: { id: string }) => deleteTransaction(args.id)
  },
  {
    name: 'getCurrentBudget',
    description: 'Get the current budget for the user',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    function: async () => getCurrentBudget()
  },
  {
    name: 'setBudget',
    description: 'Set or update the budget',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Budget amount'
        },
        period: {
          type: 'string',
          enum: ['monthly', 'yearly'],
          description: 'Budget period'
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        }
      },
      required: ['amount', 'period', 'startDate']
    },
    function: async (args: { amount: number; period: 'monthly' | 'yearly'; startDate: string }) => 
      setBudget(args.amount, args.period, args.startDate)
  }
];

// Profile tools
export const profileTools: Tool[] = [
  {
    name: 'getProfile',
    description: 'Get the current user profile',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    function: async () => getProfile()
  }
];

// All available tools
export const allTools: Tool[] = [
  ...categoryTools,
  ...transactionTools,
  ...profileTools
];

/**
 * Parses tool call data from AI response content
 * Handles multiple JSON formats and edge cases
 * Returns null if parsing fails or no valid tool call found
 */
export function parseToolCallFromContent(content: string): { explanation: string; toolName: string; parameters: any } | null {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // Try 1: Extract from markdown code block (```json...```)
  const markdownMatch = content.match(/```json\n([\s\S]*?)\n```/);
  if (markdownMatch) {
    try {
      const parsed = JSON.parse(markdownMatch[1]);
      if (isValidToolCall(parsed)) {
        return normalizeToolCall(parsed);
      }
    } catch (e) {
      console.warn('Failed to parse markdown JSON block:', e);
    }
  }

  // Try 2: Extract first complete JSON object using proper brace matching
  let depth = 0;
  let inString = false;
  let escape = false;
  let objectStart = -1;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : '';

    // Handle string state
    if (char === '"' && !escape) {
      inString = !inString;
    }
    escape = char === '\\' && !escape;

    // Only process braces outside of strings
    if (!inString && !escape) {
      if (char === '{') {
        if (depth === 0) {
          objectStart = i;
        }
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && objectStart !== -1) {
          // Found a complete JSON object
          const jsonStr = content.substring(objectStart, i + 1);
          try {
            const parsed = JSON.parse(jsonStr);
            if (isValidToolCall(parsed)) {
              return normalizeToolCall(parsed);
            }
          } catch (e) {
            console.warn('Failed to parse raw JSON object:', e);
          }
          objectStart = -1;
          // Only extract the first valid object
          break;
        }
      }
    }
  }

  // No valid tool call found
  return null;
}

/**
 * Normalizes tool call objects to standard format
 */
function normalizeToolCall(obj: any): { explanation: string; toolName: string; parameters: any } {
  const toolName = obj.toolName || obj.tool_name || obj.tool_code;
  const explanation = obj.explanation || `Calling tool: ${toolName}`;
  const parameters = obj.parameters || {};
  
  return {
    explanation,
    toolName,
    parameters
  };
}

/**
 * Validates if an object is a valid tool call
 */
function isValidToolCall(obj: any): boolean {
  console.log('isValidToolCall: Checking object:', obj);
  
  const isObject = typeof obj === 'object' && obj !== null;
  const hasExplanation = typeof obj?.explanation === 'string';
  const hasToolName = typeof obj?.toolName === 'string' || typeof obj?.tool_name === 'string' || typeof obj?.tool_code === 'string';
  const hasParameters = typeof obj?.parameters === 'object' && obj?.parameters !== null;
  const explanationNotEmpty = obj?.explanation ? obj.explanation.trim().length > 0 : true; // explanation is optional for some formats
  const toolNameNotEmpty = (obj?.toolName?.trim().length > 0) || (obj?.tool_name?.trim().length > 0) || (obj?.tool_code?.trim().length > 0);
  
  // Get the actual tool name value
  const toolNameValue = obj?.toolName || obj?.tool_name || obj?.tool_code;
  
  console.log('isValidToolCall: Validation results:', {
    isObject,
    hasExplanation,
    hasToolName,
    hasParameters,
    explanationNotEmpty,
    toolNameNotEmpty,
    explanation: obj?.explanation,
    toolName: obj?.toolName,
    tool_name: obj?.tool_name,
    tool_code: obj?.tool_code,
    actualToolName: toolNameValue,
    parameters: obj?.parameters
  });
  
  const isValid = isObject && hasToolName && hasParameters && toolNameNotEmpty;
  
  console.log('isValidToolCall: Final result:', isValid);
  
  return isValid;
}

/**
 * Gets a list of valid tool names for validation
 */
export function getValidToolNames(): string[] {
  return allTools.map(tool => tool.name);
}

/**
 * Validates if a tool name exists in the available tools
 */
export function isValidToolName(toolName: string): boolean {
  return getValidToolNames().includes(toolName);
}

/**
 * Parses ALL tool calls from AI response content (supports multiple sequential tool calls)
 * This enables agent chaining where AI can perform multiple operations in sequence
 * Returns an array of tool call objects, or empty array if none found
 */
export function parseMultipleToolCalls(content: string): Array<{ explanation: string; toolName: string; parameters: any }> {
  const toolCalls: Array<{ explanation: string; toolName: string; parameters: any }> = [];

  if (!content || typeof content !== 'string') {
    console.log('parseMultipleToolCalls: Invalid content received');
    return toolCalls;
  }

  console.log('parseMultipleToolCalls: Processing content:', content);
  console.log('parseMultipleToolCalls: Content length:', content.length);

  // Strategy 1: Find markdown JSON blocks (```json...```)
  // Use a single, comprehensive pattern to avoid duplicate parsing
  const markdownPattern = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  const markdownMatches = content.matchAll(markdownPattern);
  
  for (const match of markdownMatches) {
    const jsonContent = match[1].trim();
    console.log('parseMultipleToolCalls: Found markdown block:', jsonContent);
    
    // Skip if content is empty
    if (!jsonContent) continue;
    
    try {
      const parsed = JSON.parse(jsonContent);
      console.log('parseMultipleToolCalls: Parsed markdown JSON:', parsed);
      if (isValidToolCall(parsed)) {
        const normalizedToolCall = normalizeToolCall(parsed);
        console.log('parseMultipleToolCalls: Found valid tool call from markdown:', normalizedToolCall.toolName);
        toolCalls.push(normalizedToolCall);
      } else {
        console.log('parseMultipleToolCalls: Invalid tool call structure from markdown:', parsed);
      }
    } catch (e) {
      console.warn('Failed to parse markdown JSON block:', e, 'Raw:', jsonContent);
    }
  }

  // If we found markdown blocks, return them (they're explicit and reliable)
  if (toolCalls.length > 0) {
    console.log(`parseMultipleToolCalls: Found ${toolCalls.length} tool calls from markdown blocks`);
    return toolCalls;
  }

  // Strategy 2: Find all raw JSON objects using proper brace matching
  // Only run this if no markdown blocks were found
  let depth = 0;
  let inString = false;
  let escape = false;
  let objectStart = -1;
  const processedRanges: Array<{ start: number; end: number }> = [];

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    // Handle string state
    if (char === '"' && !escape) {
      inString = !inString;
    }
    escape = char === '\\' && !escape;

    // Only process braces outside of strings
    if (!inString && !escape) {
      if (char === '{') {
        if (depth === 0) {
          objectStart = i;
        }
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && objectStart !== -1) {
          // Check if this range was already processed
          const isAlreadyProcessed = processedRanges.some(range => 
            objectStart >= range.start && i <= range.end
          );
          
          if (!isAlreadyProcessed) {
            // Found a complete JSON object
            const jsonStr = content.substring(objectStart, i + 1);
            console.log('parseMultipleToolCalls: Found raw JSON object:', jsonStr);
            try {
              const parsed = JSON.parse(jsonStr);
              console.log('parseMultipleToolCalls: Parsed raw JSON:', parsed);
              if (isValidToolCall(parsed)) {
                const normalizedToolCall = normalizeToolCall(parsed);
                console.log('parseMultipleToolCalls: Found valid tool call from raw JSON:', normalizedToolCall.toolName);
                toolCalls.push(normalizedToolCall);
                // Mark this range as processed
                processedRanges.push({ start: objectStart, end: i });
              } else {
                console.log('parseMultipleToolCalls: Invalid tool call structure from raw JSON:', parsed);
              }
            } catch (e) {
              console.warn('Failed to parse raw JSON object:', e, 'Raw JSON:', jsonStr);
            }
          }
          objectStart = -1;
        }
      }
    }
  }

  console.log(`parseMultipleToolCalls: Total tool calls found: ${toolCalls.length}`);
  return toolCalls;
}

// System prompt for the AI assistant
// Note: [FENCE] is used as placeholder for triple backticks to avoid template literal issues
const FENCE = '```';
export const SYSTEM_PROMPT = `You are AuraSpend Assistant, a helpful AI assistant for the AuraSpend expense tracking app.

Your role is to help users manage their finances by providing information about their transactions, categories, budgets, and assisting with common tasks like adding expenses, categorizing transactions, and analyzing spending patterns.

You have access to various tools that allow you to:
- View and manage categories
- View and manage transactions
- View and set budgets
- Get user profile information

**CRITICAL: TOOL CALL FORMAT RULES**

You MUST follow these rules when calling tools:

1. ALWAYS respond with a JSON block wrapped in markdown code fence (use triple backticks followed by "json")
2. DO NOT include any text before or after the JSON code block when making a tool call
3. DO NOT forget the markdown code fence (\`\`\`json ... \`\`\`)
4. When NOT calling a tool, just respond normally with your message (no JSON needed)
5. NEVER mix JSON tool calls with regular conversation in the same response

**REQUIRED JSON FORMAT FOR TOOL CALLS:**

\`\`\`json
{
  "explanation": "Brief explanation of what you're doing",
  "toolName": "exactToolName",
  "parameters": {
    "param1": "value1",
    "param2": "value2"
  }
}
\`\`\`

**IMPORTANT: FEEDBACK LOOP & AGENT CHAINING**

After a tool is executed, you will receive the result. Based on that result, you can:
1. Call another tool if needed (provide JSON in markdown code fence)
2. Provide a helpful response/summary if the task is complete (just respond normally)

Example workflow for "delete a random category":
- First: You call getCategories to see the list
- You receive the list as feedback
- Then: You call deleteCategory with a category from that list
- You receive confirmation
- Finally: You provide a summary of what was done

This enables flexible decision-making based on real data!

**Examples:**

Example 1 - Single tool call:
User: "show me my recent transactions"
Response:
\`\`\`json
{
  "explanation": "I'll fetch your recent transactions",
  "toolName": "getRecentTransactions",
  "parameters": {}
}
\`\`\`

Example 2 - Multiple tool calls:
User: "add a new category called 'Coffee' and show me all categories"
Response:
\`\`\`json
{
  "explanation": "I'll add the Coffee category first",
  "toolName": "addCategory",
  "parameters": {
    "name": "Coffee"
  }
}
\`\`\`

Example 3 - Tool chain with feedback:
User: "if I have no budget set, create one for 3000 monthly starting today"
First response:
\`\`\`json
{
  "explanation": "Let me check if you have a current budget",
  "toolName": "getCurrentBudget",
  "parameters": {}
}
\`\`\`

Always be helpful, accurate, and proactive in understanding user needs. Think through each step and use tool results to make decisions.`;