export interface NotionConfig {
  token: string;
  databaseId: string;
  openaiApiKey: string;
}

export type NotionParagraphBlock = {
  object: "block";
  type: "paragraph";
  paragraph: {
    rich_text: { type: "text"; text: { content: string } }[];
  };
};

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
