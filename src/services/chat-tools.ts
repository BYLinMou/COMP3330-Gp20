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
    function: getCategories
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
    function: addCategory
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
    function: updateCategory
  },
  {
    name: 'deleteCategory',
    description: 'Delete a category (will nullify references in transactions first)',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the category to delete'
        }
      },
      required: ['id']
    },
    function: deleteCategory
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
    function: getRecentTransactions
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
    function: getTransactionsByDateRange
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
    function: getSpendingBreakdown
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
    function: getIncomeAndExpenses
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
        }
      },
      required: ['amount', 'occurred_at']
    },
    function: addTransaction
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
    function: updateTransaction
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
    function: deleteTransaction
  },
  {
    name: 'getCurrentBudget',
    description: 'Get the current budget for the user',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    function: getCurrentBudget
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
    function: setBudget
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
    function: getProfile
  }
];

// All available tools
export const allTools: Tool[] = [
  ...categoryTools,
  ...transactionTools,
  ...profileTools
];

// System prompt for the AI assistant
export const SYSTEM_PROMPT = `You are AuraSpend Assistant, a helpful AI assistant for the AuraSpend expense tracking app.

Your role is to help users manage their finances by providing information about their transactions, categories, budgets, and assisting with common tasks like adding expenses, categorizing transactions, and analyzing spending patterns.

You have access to various tools that allow you to:
- View and manage categories
- View and manage transactions
- View and set budgets
- Get user profile information

When a user asks you to perform an action that requires calling a tool, you should:
1. Explain what you're going to do
2. Ask for user confirmation before executing the tool
3. Only execute the tool after getting confirmation

For example:
- If user says "add a category called 'Food'", you should say "I can help you add a new category called 'Food'. Would you like me to proceed?"
- Only after they confirm, call the addCategory tool

For informational queries, you can call tools directly without confirmation, like getting recent transactions or spending breakdown.

Always be helpful, accurate, and secure. Never perform destructive actions without explicit user confirmation.`;