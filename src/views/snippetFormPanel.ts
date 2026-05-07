import * as vscode from 'vscode';
import { Snippet, SnippetInput } from '../models/snippet';
import * as crypto from 'crypto';

type SaveCallback = (data: SnippetInput) => void;

export class SnippetFormPanel {
    private static currentPanel: SnippetFormPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];

    private constructor(
        panel: vscode.WebviewPanel,
        private readonly context: vscode.ExtensionContext,
        private readonly snippet: Snippet | undefined,
        private readonly onSave: SaveCallback,
    ) {
        this.panel = panel;
        this.panel.webview.html = this.getHtml();
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        this.panel.webview.onDidReceiveMessage(
            (msg: { type: string; data?: SnippetInput }) => {
                if (msg.type === 'save' && msg.data) {
                    this.onSave(msg.data);
                    this.panel.dispose();
                } else if (msg.type === 'cancel') {
                    this.panel.dispose();
                } else if (msg.type === 'ready') {
                    // Send initial data to form
                    if (this.snippet) {
                        this.panel.webview.postMessage({
                            type: 'init',
                            data: {
                                title: this.snippet.title,
                                content: this.snippet.content,
                                language: this.snippet.language,
                                description: this.snippet.description,
                                tagNames: (this.snippet.tags ?? []).map(t => t.name),
                            },
                        });
                    }
                }
            },
            null,
            this.disposables,
        );
    }

    static createOrShow(
        context: vscode.ExtensionContext,
        snippet: Snippet | undefined,
        onSave: SaveCallback,
    ): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (SnippetFormPanel.currentPanel) {
            SnippetFormPanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'snipfastForm',
            snippet ? `编辑: ${snippet.title}` : '新增 Snippet',
            column ?? vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [context.extensionUri],
            },
        );

        SnippetFormPanel.currentPanel = new SnippetFormPanel(panel, context, snippet, onSave);
    }

    private dispose(): void {
        SnippetFormPanel.currentPanel = undefined;
        this.panel.dispose();
        for (const d of this.disposables) {
            d.dispose();
        }
        this.disposables = [];
    }

    private getHtml(): string {
        const nonce = crypto.randomBytes(16).toString('hex');
        const csp = `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';`;

        return /* html */ `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Snippet</title>
<style nonce="${nonce}">
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
    margin: 0;
    padding: 16px 20px 24px;
  }
  h2 {
    margin: 0 0 16px;
    font-size: 1.1em;
    font-weight: 600;
    color: var(--vscode-titleBar-activeForeground, var(--vscode-foreground));
  }
  .field { margin-bottom: 14px; }
  label {
    display: block;
    margin-bottom: 4px;
    font-size: 0.85em;
    color: var(--vscode-descriptionForeground);
  }
  label span { color: var(--vscode-errorForeground); }
  input, textarea, select {
    width: 100%;
    padding: 6px 8px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, transparent);
    border-radius: 3px;
    font-family: inherit;
    font-size: inherit;
    outline: none;
  }
  input:focus, textarea:focus, select:focus {
    border-color: var(--vscode-focusBorder);
  }
  textarea#content {
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: var(--vscode-editor-font-size, 13px);
    min-height: 280px;
    resize: vertical;
  }
  .row { display: flex; gap: 12px; }
  .row .field { flex: 1; }
  .hint { font-size: 0.78em; color: var(--vscode-descriptionForeground); margin-top: 3px; }
  .actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
  }
  button {
    padding: 6px 18px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: inherit;
    font-family: inherit;
  }
  #btnSave {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }
  #btnSave:hover { background: var(--vscode-button-hoverBackground); }
  #btnCancel {
    background: var(--vscode-button-secondaryBackground, transparent);
    color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
    border: 1px solid var(--vscode-button-border, var(--vscode-input-border, transparent));
  }
  #btnCancel:hover { background: var(--vscode-button-secondaryHoverBackground, rgba(128,128,128,0.1)); }
  .error { border-color: var(--vscode-inputValidation-errorBorder) !important; }
</style>
</head>
<body>
<h2 id="formTitle">新增 Snippet</h2>

<div class="field">
  <label for="title">标题 <span>*</span></label>
  <input id="title" type="text" placeholder="给 snippet 起个名字…" autocomplete="off">
</div>

<div class="row">
  <div class="field">
    <label for="language">语言</label>
    <input id="language" type="text" placeholder="javascript, python, sql…" autocomplete="off">
  </div>
  <div class="field">
    <label for="tags">标签</label>
    <input id="tags" type="text" placeholder="用逗号分隔，如: react, hooks" autocomplete="off">
    <div class="hint">多个标签用英文逗号分隔</div>
  </div>
</div>

<div class="field">
  <label for="description">描述</label>
  <input id="description" type="text" placeholder="简要说明用途（可选）" autocomplete="off">
</div>

<div class="field">
  <label for="content">代码内容 <span>*</span></label>
  <textarea id="content" spellcheck="false" placeholder="在此粘贴代码…"></textarea>
</div>

<div class="actions">
  <button id="btnCancel">取消</button>
  <button id="btnSave">保存</button>
</div>

<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();

  const titleEl       = document.getElementById('title');
  const languageEl    = document.getElementById('language');
  const tagsEl        = document.getElementById('tags');
  const descriptionEl = document.getElementById('description');
  const contentEl     = document.getElementById('content');
  const btnSave       = document.getElementById('btnSave');
  const btnCancel     = document.getElementById('btnCancel');
  const formTitle     = document.getElementById('formTitle');

  // Notify host that WebView is ready
  vscode.postMessage({ type: 'ready' });

  window.addEventListener('message', e => {
    const msg = e.data;
    if (msg.type === 'init' && msg.data) {
      formTitle.textContent = '编辑 Snippet';
      titleEl.value       = msg.data.title       ?? '';
      languageEl.value    = msg.data.language     ?? '';
      tagsEl.value        = (msg.data.tagNames ?? []).join(', ');
      descriptionEl.value = msg.data.description  ?? '';
      contentEl.value     = msg.data.content      ?? '';
    }
  });

  btnSave.addEventListener('click', () => {
    const title   = titleEl.value.trim();
    const content = contentEl.value;

    titleEl.classList.toggle('error', !title);
    contentEl.classList.toggle('error', !content);
    if (!title || !content) { return; }

    const tagNames = tagsEl.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    vscode.postMessage({
      type: 'save',
      data: {
        title,
        content,
        language:    languageEl.value.trim(),
        description: descriptionEl.value.trim(),
        tagNames,
      },
    });
  });

  btnCancel.addEventListener('click', () => {
    vscode.postMessage({ type: 'cancel' });
  });

  // Ctrl/Cmd+Enter shortcut to save
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      btnSave.click();
    }
    if (e.key === 'Escape') {
      btnCancel.click();
    }
  });

  titleEl.focus();
</script>
</body>
</html>`;
    }
}
