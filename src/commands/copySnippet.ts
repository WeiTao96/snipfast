import * as vscode from 'vscode';
import { SnippetTreeItem } from '../providers/snippetTreeProvider';

export function registerCopySnippet(): vscode.Disposable {
    return vscode.commands.registerCommand('snipfast.copySnippet', async (item?: SnippetTreeItem) => {
        const snippet = item?.snippet;
        if (!snippet) {
            vscode.window.showWarningMessage('请先在列表中选择一个 Snippet。');
            return;
        }

        await vscode.env.clipboard.writeText(snippet.content);
        vscode.window.showInformationMessage(`已复制到剪贴板: ${snippet.title}`);
    });
}
