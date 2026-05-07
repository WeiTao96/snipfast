import * as vscode from 'vscode';
import { SnippetFormPanel } from '../views/snippetFormPanel';
import { SnippetTreeProvider } from '../providers/snippetTreeProvider';
import * as repo from '../database/snippetRepository';

export function registerAddSnippet(
    context: vscode.ExtensionContext,
    treeProvider: SnippetTreeProvider,
): vscode.Disposable {
    return vscode.commands.registerCommand('snipfast.addSnippet', () => {
        SnippetFormPanel.createOrShow(context, undefined, (data) => {
            repo.create(data);
            treeProvider.refresh();
            vscode.window.showInformationMessage(`已保存片段: ${data.title}`);
        });
    });
}
