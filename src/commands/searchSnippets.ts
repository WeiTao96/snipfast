import * as vscode from 'vscode';
import * as repo from '../database/snippetRepository';
import { Snippet } from '../models/snippet';
import { insertSnippetContent } from './insertSnippet';

export function registerSearchSnippets(): vscode.Disposable {
    return vscode.commands.registerCommand('snipfast.searchSnippets', async () => {
        const allSnippets = repo.getAll();

        if (allSnippets.length === 0) {
            vscode.window.showInformationMessage('还没有保存任何 Snippet，请先添加。');
            return;
        }

        type SnippetQuickPickItem = vscode.QuickPickItem & { snippet: Snippet };

        const toItem = (s: Snippet): SnippetQuickPickItem => ({
            label: s.title,
            description: s.language || undefined,
            detail: [
                s.description || '',
                (s.tags ?? []).map(t => `#${t.name}`).join(' '),
            ].filter(Boolean).join('  |  ') || undefined,
            snippet: s,
        });

        const quickPick = vscode.window.createQuickPick<SnippetQuickPickItem>();
        quickPick.placeholder = '搜索 Snippet…（标题 / 描述 / 标签 / 内容）';
        quickPick.matchOnDescription = true;
        quickPick.matchOnDetail = true;
        quickPick.items = allSnippets.map(toItem);

        quickPick.onDidChangeValue(query => {
            if (!query.trim()) {
                quickPick.items = allSnippets.map(toItem);
            } else {
                quickPick.items = repo.search(query).map(toItem);
            }
        });

        quickPick.onDidAccept(() => {
            const selected = quickPick.selectedItems[0];
            quickPick.hide();
            if (selected) {
                insertSnippetContent(selected.snippet.content);
            }
        });

        quickPick.show();
    });
}
