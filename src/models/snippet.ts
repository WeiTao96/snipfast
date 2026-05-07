export interface Snippet {
    id: number;
    title: string;
    content: string;
    language: string;
    description: string;
    created_at: string;
    updated_at: string;
    tags?: Tag[];
}

export interface Tag {
    id: number;
    name: string;
}

export interface SnippetInput {
    title: string;
    content: string;
    language: string;
    description: string;
    tagNames: string[];
}
