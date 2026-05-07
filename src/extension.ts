import * as vscode from 'vscode';
import { initDB, closeDB } from './database/db';
import { SnippetTreeProvider } from './providers/snippetTreeProvider';
import { registerAddSnippet }    from './commands/addSnippet';
import { registerEditSnippet }   from './commands/editSnippet';
import { registerDeleteSnippet } from './commands/deleteSnippet';
import { registerSearchSnippets } from './commands/searchSnippets';
import { registerInsertSnippet } from './commands/insertSnippet';
import { registerCopySnippet }   from './commands/copySnippet';

export function activate(context: vscode.ExtensionContext): void {
    // Initialize SQLite database in global storage (persists across workspaces)
    initDB(context.globalStorageUri.fsPath);

    // Register TreeView
    const treeProvider = new SnippetTreeProvider();
    const treeView = vscode.window.createTreeView('snipfast.snippetList', {
        treeDataProvider: treeProvider,
        showCollapseAll: true,
    });

    // Register a preview command (reveal snippet in a read-only editor)
    const previewCmd = vscode.commands.registerCommand(
        'snipfast.previewSnippet',
        async () => { /* single-click: no-op; double-click handled by insert */ },
    );

    // Register all feature commands
    context.subscriptions.push(
        treeView,
        previewCmd,
        registerAddSnippet(context, treeProvider),
        registerEditSnippet(context, treeProvider),
        registerDeleteSnippet(treeProvider),
        registerSearchSnippets(),
        registerInsertSnippet(),
        registerCopySnippet(),
    );
}

export function deactivate(): void {
    closeDB();
}
