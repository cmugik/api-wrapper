import Database from 'better-sqlite3';
import type { Database as DatabaseType, Statement } from 'better-sqlite3';
import { retryAsync, retry } from 'ts-retry';

class TransactionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TransactionError';
    }
}

export class ConversationDatabase {
    private db: DatabaseType;

    // Call initialize after constructor!!!
    constructor() {
        this.db = new Database('conversations.db', {});
        this.db.pragma('journal_mode = WAL');    
    }

    public async initialize(): Promise<void> {
        await retryAsync(async () => {
            try {
                await this.initializeTables();
            } catch (error) {
                console.error('error init db tables: ', error);
                throw error;
            }
        }, {
            delay: 500,
            maxTry: 3
        });
    }

    private async initializeTables(): Promise<void> {
        const tablesExist = await this.checkTablesExist();
        if (!tablesExist) {
            await this.createTables();
        }
    }

    public async checkTablesExist(): Promise<boolean> {
        try {
            const statement: Statement = this.db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`);
            const row0 = statement.get("conversation"); 
            const row1 = statement.get("message");
            return !(row0 == null || row1 == null);
        } catch (error) {
            console.error(`Error checking if table 'conversation' exists:`, error);
            throw error;
        }
    }

    private async createTables(): Promise<void> {
        try {
            const conversationCreationStatement: Statement = 
                this.db.prepare(`CREATE TABLE conversation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                name TEXT
            )`);

            const messageCreationStatement: Statement = 
                this.db.prepare(`CREATE TABLE message (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversationId INTEGER,
                role TEXT,
                content TEXT,
                name TEXT,
                severity TEXT,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversationId) REFERENCES conversation(id) ON DELETE CASCADE
            )`);

            const creationTransaction = this.db.transaction(()=>{
                conversationCreationStatement.run();
                messageCreationStatement.run();
            });
            creationTransaction(); // need to run the transaction after its created
        } catch (error) {
            console.error('Error creating tables:', error);
            throw error;
        }
    }

    // returns id of newly created convo
    startNewConversation(): number {
        try {
            const stmt: Statement = this.db.prepare('INSERT INTO conversation DEFAULT VALUES');
            const info = stmt.run();
            return Number(info.lastInsertRowid);
        } catch (err) {
            console.error('Error starting new empty convo', err);
            throw err;
        }
    }

    public async saveMessage(conversationId: number, message: Message): Promise<number> {
        try {
            const stmt: Statement = this.db.prepare('INSERT INTO message (conversationId, role, content, name, date, severity) VALUES (?, ?, ?, ?, ?, ?)');
            const info = stmt.run(conversationId, message.role, message.content, message.name, message.date.toISOString(), message.severity);
            return Number(info.lastInsertRowid);
        } catch (err) {
            console.error('Error saving message', err);
            throw err;
        }
    }

    public async getRecentMessages(conversationId: number, numMessages: number = 10, offset: number = 0): Promise<Message[]> {
        const stmt: Statement = this.db.prepare(`
            SELECT * FROM message 
            WHERE conversationId = ?
            ORDER BY date DESC
            LIMIT ? OFFSET ?
        `);
        const rows: Message[] = stmt.all(conversationId, numMessages, offset) as Message[];
        for (const message of rows) {
            message.date = new Date(message.date);
            message.severity = message.severity ?? undefined;
        } 
        return rows as Message[];
    }

    public async getAllConversations(): Promise<Conversation[]> {
        const stmt: Statement = this.db.prepare('SELECT * FROM conversation');
        const rows: Conversation[] = stmt.all() as Conversation[];
        return rows as Conversation[];
    }

    public async close(): Promise<void> {
        if (!this.db.open) {
            throw new Error("Database is not open.");
        } else {
            await retry(() => {
                try {
                    if (this.db.inTransaction) {
                        throw new TransactionError("Transaction in progress - try again later");
                    } else {
                        this.db.close();
                    }
                } catch (err) {
                    console.error(err);
                    throw err;
                }
            },
            {
                delay: 100,
                maxTry: 5
            });
        }
    }

    public emptyTables(): void {
        this.db.prepare(`DELETE FROM conversation`).run();
        this.db.prepare(`DELETE FROM message`).run();
    }

}
