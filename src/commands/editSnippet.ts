import * as vscode from 'vscode';
import { SnippetFormPanel } from '../views/snippetFormPanel';
import { SnippetTreeProvider, SnippetTreeItem } from '../providers/snippetTreeProvider';
import * as repo from '../database/snippetRepository';

export function registerEditSnippet(
    context: vscode.ExtensionContext,
    treeProvider: SnippetTreeProvider,
): vscode.Disposable {
    return vscode.commands.registerCommand('snipfast.editSnippet', (item?: SnippetTreeItem) => {
        const snippet = item?.snippet;
        if (!snippet) {
            vscode.window.showWarningMessage('请先在列表中选择一个 Snippet。');
            return;
        }

        SnippetFormPanel.createOrShow(context, snippet, (data) => {
            repo.update(snippet.id, data);
            treeProvider.refresh();
            vscode.window.showInformationMessage(`已更新片段: ${data.title}`);
        });
    });
}
