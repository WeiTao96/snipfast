import * as vscode from 'vscode';
import { SnippetTreeProvider, SnippetTreeItem } from '../providers/snippetTreeProvider';
import * as repo from '../database/snippetRepository';

export function registerDeleteSnippet(
    treeProvider: SnippetTreeProvider,
): vscode.Disposable {
    return vscode.commands.registerCommand('snipfast.deleteSnippet', async (item?: SnippetTreeItem) => {
        const snippet = item?.snippet;
        if (!snippet) {
            vscode.window.showWarningMessage('请先在列表中选择一个 Snippet。');
            return;
        }

        const answer = await vscode.window.showWarningMessage(
            `确定要删除 "${snippet.title}" 吗？此操作无法撤销。`,
            { modal: true },
            '删除',
        );

        if (answer === '删除') {
            repo.remove(snippet.id);
            repo.pruneOrphanTags();
            treeProvider.refresh();
            vscode.window.showInformationMessage(`已删除片段: ${snippet.title}`);
        }
    });
}
