import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function proposeEvent(keywords: string[]): Promise<string> {
  const promptKeywords = keywords.join('、');
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'あなたはプロのコミュニティイベントプランナーです。以下のキーワードをもとに、参加者がすぐにイベントに参加したくなるような、具体的かつ詳細なイベント企画案を考案してください。必ず、以下の項目を含み、指定されたJSON形式でのみ出力してください。\n\n' +
          '【JSON形式の出力フォーマット】\n' +
          '{"theme": "イベントのテーマ", "purpose": "開催目的", "activities": "具体的なアクティビティ", "participation": "参加方法", "venue": "開催場所", "datetime": "開催日時の例", "details": "その他詳細"}\n\n' +
          '余計な説明やコメントは一切出力せず、上記JSONオブジェクトのみ返してください。'
      },
      {
        role: 'user',
        content: `以下のキーワードが最近よく出現しています: ${promptKeywords}`
      },
      {
        role: 'user',
        content:
          '上記のキーワードをもとに、参加者が具体的にイベントに参加したくなるような、詳細な企画案を出力してください。'
      }
    ],
    model: 'deepseek-chat',
  });

  let responseContent = completion.choices[0].message.content || '';
  console.log('Raw response from DeepSeek:', responseContent);
  // Markdownのコードブロックを除去し、余分な空白をトリム
  responseContent = responseContent.replace(/^```json\s*|```$/g, '').trim();
  
  try {
    const parsed = JSON.parse(responseContent);
    const { theme, purpose, activities, participation, venue, datetime, details } = parsed;
    return (
      `【テーマ】 ${theme}\n` +
      `【目的】 ${purpose}\n` +
      `【アクティビティ】 ${activities}\n` +
      `【参加方法】 ${participation}\n` +
      `【開催場所】 ${venue}\n` +
      `【開催日時】 ${datetime}\n` +
      `【その他詳細】 ${details}`
    );
  } catch (error) {
    console.error('JSON parse error:', error);
    return 'イベント提案が生成できませんでした。';
  }
}
