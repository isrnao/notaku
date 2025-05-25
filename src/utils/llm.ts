import { Result } from '../types';

export async function extractArticleContent(
  text: string,
  apiKey: string
): Promise<Result<string, string>> {
  const prompt = `
以下はWebページ全体のテキストです。
この中から「記事本文のみ」を抽出してください。
本文だけを抜き出して、余計な要素は出力しないでください。
元の段落を維持して下さい。

テキスト:
${text}
  `;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano-2025-04-14",
        messages: [
          { role: "system", content: "あなたは記事抽出のプロフェッショナルです。" },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
        temperature: 0.2,
      }),
    });
    const data = await res.json();
    if (
      !data.choices ||
      !data.choices[0] ||
      !data.choices[0].message.content
    ) {
      return { ok: false, error: "LLMの抽出に失敗しました" };
    }
    return { ok: true, value: data.choices[0].message.content.trim() };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
