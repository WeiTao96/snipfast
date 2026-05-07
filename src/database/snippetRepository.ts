import { getDB } from './db';
import { Snippet, Tag, SnippetInput } from '../models/snippet';

// ─── Tags ────────────────────────────────────────────────────────────────────

export function getAllTags(): Tag[] {
    return getDB().prepare('SELECT * FROM tags ORDER BY name').all() as Tag[];
}

function upsertTag(name: string): number {
    const db = getDB();
    db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(name.trim());
    const row = db.prepare('SELECT id FROM tags WHERE name = ?').get(name.trim()) as { id: number };
    return row.id;
}

function setSnippetTags(snippetId: number, tagNames: string[]): void {
    const db = getDB();
    db.prepare('DELETE FROM snippet_tags WHERE snippet_id = ?').run(snippetId);
    for (const name of tagNames) {
        if (!name.trim()) { continue; }
        const tagId = upsertTag(name);
        db.prepare('INSERT OR IGNORE INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)').run(snippetId, tagId);
    }
}

export function getTagsBySnippetId(snippetId: number): Tag[] {
    return getDB()
        .prepare(`SELECT t.* FROM tags t
                  JOIN snippet_tags st ON st.tag_id = t.id
                  WHERE st.snippet_id = ?
                  ORDER BY t.name`)
        .all(snippetId) as Tag[];
}

// ─── Snippets ─────────────────────────────────────────────────────────────────

function attachTags(snippet: Snippet): Snippet {
    snippet.tags = getTagsBySnippetId(snippet.id);
    return snippet;
}

export function getAll(): Snippet[] {
    const rows = getDB()
        .prepare('SELECT * FROM snippets ORDER BY updated_at DESC')
        .all() as Snippet[];
    return rows.map(attachTags);
}

export function getById(id: number): Snippet | undefined {
    const row = getDB()
        .prepare('SELECT * FROM snippets WHERE id = ?')
        .get(id) as Snippet | undefined;
    return row ? attachTags(row) : undefined;
}

export function search(query: string, tagName?: string): Snippet[] {
    const db = getDB();
    const like = `%${query}%`;

    let rows: Snippet[];
    if (tagName) {
        rows = db.prepare(`
            SELECT DISTINCT s.* FROM snippets s
            JOIN snippet_tags st ON st.snippet_id = s.id
            JOIN tags t ON t.id = st.tag_id
            WHERE t.name = ?
              AND (s.title LIKE ? OR s.description LIKE ? OR s.content LIKE ?)
            ORDER BY s.updated_at DESC
        `).all(tagName, like, like, like) as Snippet[];
    } else {
        rows = db.prepare(`
            SELECT * FROM snippets
            WHERE title LIKE ? OR description LIKE ? OR content LIKE ?
            ORDER BY updated_at DESC
        `).all(like, like, like) as Snippet[];
    }

    return rows.map(attachTags);
}

export function getByTag(tagName: string): Snippet[] {
    const rows = getDB().prepare(`
        SELECT DISTINCT s.* FROM snippets s
        JOIN snippet_tags st ON st.snippet_id = s.id
        JOIN tags t ON t.id = st.tag_id
        WHERE t.name = ?
        ORDER BY s.updated_at DESC
    `).all(tagName) as Snippet[];
    return rows.map(attachTags);
}

export function getUntagged(): Snippet[] {
    const rows = getDB().prepare(`
        SELECT * FROM snippets
        WHERE id NOT IN (SELECT DISTINCT snippet_id FROM snippet_tags)
        ORDER BY updated_at DESC
    `).all() as Snippet[];
    return rows.map(attachTags);
}

export function create(data: SnippetInput): Snippet {
    const db = getDB();
    const result = db.prepare(`
        INSERT INTO snippets (title, content, language, description)
        VALUES (?, ?, ?, ?)
    `).run(data.title, data.content, data.language, data.description);

    const id = result.lastInsertRowid as number;
    setSnippetTags(id, data.tagNames);
    return getById(id)!;
}

export function update(id: number, data: SnippetInput): Snippet | undefined {
    const db = getDB();
    db.prepare(`
        UPDATE snippets
        SET title = ?, content = ?, language = ?, description = ?,
            updated_at = datetime('now')
        WHERE id = ?
    `).run(data.title, data.content, data.language, data.description, id);

    setSnippetTags(id, data.tagNames);
    return getById(id);
}

export function remove(id: number): void {
    getDB().prepare('DELETE FROM snippets WHERE id = ?').run(id);
}

// Clean up orphaned tags (no snippets reference them)
export function pruneOrphanTags(): void {
    getDB().prepare(`
        DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM snippet_tags)
    `).run();
}
