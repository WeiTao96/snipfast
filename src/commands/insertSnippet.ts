import * as vscode from 'vscode';
import { SnippetTreeItem } from '../providers/snippetTreeProvider';

export function insertSnippetContent(content: string): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('没有活动的编辑器，无法插入 Snippet。');
        return;
    }

    editor.edit(editBuilder => {
        for (const selection of editor.selections) {
            editBuilder.replace(selection, content);
        }
    });
}

export function registerInsertSnippet(): vscode.Disposable {
    return vscode.commands.registerCommand('snipfast.insertSnippet', (item?: SnippetTreeItem) => {
        const snippet = item?.snippet;
        if (!snippet) {
            vscode.window.showWarningMessage('请先在列表中选择一个 Snippet。');
            return;
        }
        insertSnippetContent(snippet.content);
    });
}
