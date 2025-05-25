import { NotionConfig, NotionParagraphBlock, Result } from '../types';

export const splitToBlocks = (text: string): NotionParagraphBlock[] =>
  text.length === 0
    ? []
    : Array.from({ length: Math.ceil(text.length / 2000) }, (_, i) => ({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            { type: "text", text: { content: text.slice(i * 2000, (i + 1) * 2000) } },
          ],
        },
      }));

export async function saveToNotion(
  title: string,
  content: string,
  url: string,
  config: NotionConfig
): Promise<Result<void, string>> {
  const body = {
    parent: { database_id: config.databaseId },
    properties: {
        title: { title: [{ text: { content: title } }] },
        category: { select: { name: "webClip" } },
        createdAt: { date: { start: new Date().toISOString() } },
        updatedAt: { date: { start: new Date().toISOString() } },
        source: { url: url },
    },
    children: splitToBlocks(content),
  };

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      return { ok: true, value: undefined };
    } else {
      const text = await res.text();
      return { ok: false, error: text };
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
