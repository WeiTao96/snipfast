import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

let db: Database.Database | null = null;

export function initDB(storagePath: string): Database.Database {
    fs.mkdirSync(storagePath, { recursive: true });
    const dbPath = path.join(storagePath, 'snipfast.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(`
        CREATE TABLE IF NOT EXISTS snippets (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL,
            content     TEXT    NOT NULL DEFAULT '',
            language    TEXT    NOT NULL DEFAULT '',
            description TEXT    NOT NULL DEFAULT '',
            created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS tags (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT    NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS snippet_tags (
            snippet_id INTEGER NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
            tag_id     INTEGER NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
            PRIMARY KEY (snippet_id, tag_id)
        );
    `);

    return db;
}

export function getDB(): Database.Database {
    if (!db) {
        throw new Error('Database not initialized. Call initDB() first.');
    }
    return db;
}

export function closeDB(): void {
    if (db) {
        db.close();
        db = null;
    }
}
