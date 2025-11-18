import { supabase } from './supabase';

// 与 items 表对应的类型
export interface ItemRow {
  id: string;
  transaction_id: string;
  item_name: string;
  item_amount: number;
  item_price: number;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

// Add.tsx 中的 ReceiptItem 接口的简化映射
export interface ReceiptItemInput {
  name: string;      // item_name
  amount: number;    // item_amount
  price: number;     // item_price (单价)
}

/**
 * 批量为某个交易(transaction)插入收据条目
 * @param transactionId 交易 ID
 * @param items ReceiptItemInput 数组
 */
export async function addReceiptItems(
  transactionId: string,
  items: ReceiptItemInput[]
) {
  if (!transactionId) {
    throw new Error('transactionId 不能为空');
  }
  if (!items || items.length === 0) {
    return [] as ItemRow[]; // 无需插入
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('用户未认证，无法保存条目');
  }

  // 构造待插入的行
  const rows = items.map(it => ({
    transaction_id: transactionId,
    item_name: it.name?.trim() || 'Item',
    item_amount: Number.isFinite(it.amount) ? it.amount : 1,
    item_price: Number.isFinite(it.price) ? it.price : 0,
    user_id: user.id,
  }));

  const { data, error } = await supabase
    .from('items')
    .insert(rows)
    .select();

  if (error) {
    console.error('[items] 插入收据条目失败:', error);
    throw error;
  }

  return data as ItemRow[];
}

/**
 * 根据 transaction_id 获取该交易的所有条目
 */
export async function getItemsByTransaction(transactionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('用户未认证');
  }
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('transaction_id', transactionId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[items] 获取交易条目失败:', error);
    throw error;
  }
  return data as ItemRow[];
}

/**
 * 删除某条 item 记录
 */
export async function deleteItem(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('用户未认证');
  }
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) {
    console.error('[items] 删除条目失败:', error);
    throw error;
  }
  return true;
}
