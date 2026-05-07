import * as vscode from 'vscode';
import { Snippet, Tag } from '../models/snippet';
import * as repo from '../database/snippetRepository';

// ─── Tree Item ────────────────────────────────────────────────────────────────

export class SnippetTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly snippet?: Snippet,
        public readonly tagName?: string,
    ) {
        super(label, collapsibleState);

        if (snippet) {
            // Leaf node — individual snippet
            this.description = snippet.language || '';
            this.tooltip = snippet.description || snippet.title;
            this.contextValue = 'snippet';
            this.command = {
                command: 'snipfast.previewSnippet',
                title: 'Preview',
                arguments: [this],
            };
        } else {
            // Group node — tag header
            this.contextValue = 'tagGroup';
            this.iconPath = new vscode.ThemeIcon('tag');
        }
    }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class SnippetTreeProvider implements vscode.TreeDataProvider<SnippetTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<SnippetTreeItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private filterQuery: string = '';

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    setFilter(query: string): void {
        this.filterQuery = query;
        this.refresh();
    }

    getTreeItem(element: SnippetTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SnippetTreeItem): SnippetTreeItem[] {
        if (!element) {
            return this.buildRootNodes();
        }

        // Expand a tag group
        if (element.tagName === '__all__') {
            const snippets = this.filterQuery
                ? repo.search(this.filterQuery)
                : repo.getAll();
            return snippets.map(s => this.snippetItem(s));
        }

        if (element.tagName === '__untagged__') {
            const snippets = this.filterQuery
                ? repo.search(this.filterQuery).filter(s => !s.tags || s.tags.length === 0)
                : repo.getUntagged();
            return snippets.map(s => this.snippetItem(s));
        }

        if (element.tagName) {
            const snippets = this.filterQuery
                ? repo.search(this.filterQuery, element.tagName)
                : repo.getByTag(element.tagName);
            return snippets.map(s => this.snippetItem(s));
        }

        return [];
    }

    private buildRootNodes(): SnippetTreeItem[] {
        const nodes: SnippetTreeItem[] = [];

        // "All" group
        const allItem = new SnippetTreeItem(
            '所有片段',
            vscode.TreeItemCollapsibleState.Expanded,
            undefined,
            '__all__',
        );
        allItem.iconPath = new vscode.ThemeIcon('list-unordered');
        nodes.push(allItem);

        // Per-tag groups
        const tags: Tag[] = repo.getAllTags();
        for (const tag of tags) {
            const item = new SnippetTreeItem(
                tag.name,
                vscode.TreeItemCollapsibleState.Collapsed,
                undefined,
                tag.name,
            );
            nodes.push(item);
        }

        // "Untagged" group (only show when there are untagged snippets)
        const untagged = repo.getUntagged();
        if (untagged.length > 0) {
            const item = new SnippetTreeItem(
                '未分类',
                vscode.TreeItemCollapsibleState.Collapsed,
                undefined,
                '__untagged__',
            );
            item.iconPath = new vscode.ThemeIcon('question');
            nodes.push(item);
        }

        return nodes;
    }

    private snippetItem(snippet: Snippet): SnippetTreeItem {
        return new SnippetTreeItem(
            snippet.title,
            vscode.TreeItemCollapsibleState.None,
            snippet,
        );
    }
}
