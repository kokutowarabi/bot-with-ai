import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URLまたはSUPABASE_KEYが設定されていません。');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// メッセージの型
export interface Message {
  id: string;
  content: string;
  channel_id: string;
  created_at?: string;
}

// メッセージをアップサート（新規追加または更新）する関数
export async function saveMessages(messages: Message[]): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .upsert(messages, { onConflict: 'id' });
  if (error) {
    throw error;
  }
}

// DBに保存されている全メッセージを取得する関数
export async function getAllMessages(): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*');
  if (error) {
    throw error;
  }
  return data || [];
}
