import { NotionConfig } from './types';
import { extractArticleContent } from './utils/llm';
import { saveToNotion } from './utils/notion';

function getConfig(): NotionConfig {
  return {
    token: localStorage.getItem('notionToken') || "",
    databaseId: localStorage.getItem('notionDatabaseId') || "",
    openaiApiKey: localStorage.getItem('openaiApiKey') || ""
  };
}

function saveConfig(cfg: NotionConfig): void {
  localStorage.setItem('notionToken', cfg.token);
  localStorage.setItem('notionDatabaseId', cfg.databaseId);
  localStorage.setItem('openaiApiKey', cfg.openaiApiKey);
}
function resetConfig(): void {
  localStorage.removeItem('notionToken');
  localStorage.removeItem('notionDatabaseId');
  localStorage.removeItem('openaiApiKey');
}

type ViewState = "init" | "configured" | "reset";
function setViewState(state: ViewState, form: HTMLElement, saveBtn: HTMLElement, resetBtn: HTMLElement, startupMessage: HTMLDivElement) {
  if (state === "configured") {
    form.style.display = "none";
    saveBtn.style.display = "";
    resetBtn.style.display = "";
    startupMessage.style.display = "none";
  } else {
    form.style.display = "";
    saveBtn.style.display = "none";
    resetBtn.style.display = "none";
    startupMessage.style.display = "";
  }
}

// --- UIイベント ---
window.addEventListener('DOMContentLoaded', () => {
  const config = getConfig();
  const form = document.getElementById('configForm') as HTMLFormElement | null;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement | null;
  const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement | null;
  const status = document.getElementById('status') as HTMLDivElement | null;
  const startupMessage = document.getElementById('startupMessage') as HTMLDivElement | null;
  if (!form || !saveBtn || !status || !resetBtn || !startupMessage) return;

  if(config.token && config.databaseId && config.openaiApiKey) {
    setViewState("configured", form, saveBtn, resetBtn, startupMessage);
  } else {
    setViewState("init", form, saveBtn, resetBtn, startupMessage);
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    const tokenInput = document.getElementById('notionToken') as HTMLInputElement | null;
    const dbIdInput = document.getElementById('notionDatabaseId') as HTMLInputElement | null;
    const openaiApiKeyInput = document.getElementById('openaiApiKey') as HTMLInputElement | null;
    if (!tokenInput || !dbIdInput || !openaiApiKeyInput) return;
    saveConfig({
      token: tokenInput.value,
      databaseId: dbIdInput.value,
      openaiApiKey: openaiApiKeyInput.value
    });
    setViewState("configured", form, saveBtn, resetBtn, startupMessage);
    status.innerText = "設定を保存しました！";
  };

  resetBtn.addEventListener('click', () => {
    resetConfig();
    setViewState("init", form, saveBtn, resetBtn, startupMessage);
    status.innerText = "設定をリセットしました。再度入力してください。";
  });

  saveBtn.addEventListener('click', async () => {
    const config = getConfig();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;
    status.innerText = "本文抽出中（LLM）...";

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => ({
          title: document.title,
          content: document.body.innerText,
          url: window.location.href
        }),
      },
      async (injectionResults) => {
        const result = injectionResults?.[0]?.result;
        if (!result) return;
        const articleResult = await extractArticleContent(result.content, config.openaiApiKey);
        if (!articleResult.ok) {
          status.innerText = "LLMでの抽出に失敗しました: " + articleResult.error;
          return;
        }
        status.innerText = "Notionに送信中...";
        const notionResult = await saveToNotion(result.title, articleResult.value, result.url, config);
        if (notionResult.ok) {
          status.innerText = "Notionに保存しました！";
        } else {
          status.innerText = `エラー: ${notionResult.error}`;
        }
      }
    );
  });
});
