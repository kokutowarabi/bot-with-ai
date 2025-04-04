import kuromoji from 'kuromoji';

// 辞書ファイルのパス（package.jsonと同じ階層の場合）
const dicPath = 'node_modules/kuromoji/dict';

export async function analyzeMessages(messages: string[]): Promise<string[]> {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath }).build((err, tokenizer) => {
      if (err) {
        return reject(err);
      }
      
      // 単語の出現頻度を計算するためのMap
      const frequencyMap = new Map<string, number>();

      // 各メッセージを解析
      messages.forEach((text) => {
        // 形態素解析を実施
        const tokens = tokenizer.tokenize(text);
        tokens.forEach((token) => {
          // 名詞のみ対象（必要に応じてその他の品詞も追加）
          if (token.pos === '名詞') {
            // token.basic_form が '*' の場合は元の表層形を使用
            const word = token.basic_form === '*' ? token.surface_form : token.basic_form;
            // 3文字以上の単語などフィルタリング（任意）
            if (word.length < 2) return;
            frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1);
          }
        });
      });

      // 出現頻度の高い順にソートし、上位N個のキーワードを抽出
      const sortedKeywords = Array.from(frequencyMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word);

      // ここでは上位10件をキーワードとして返す例
      resolve(sortedKeywords.slice(0, 10));
    });
  });
}
