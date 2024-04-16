import * as sqlite3 from 'sqlite3';

interface Conversation {
    id: number;
    createdAt: string;
}


export class ConversationService {
    private db: sqlite3.Database;

    constructor() {
        this.db = new sqlite3.Database('conversations.db');

        // Initialize tables if needed
        this.initializeTables();
    }

    private async initializeTables() {
        // Check if the 'conversations' table exists
        const tablesExist = await new Promise<boolean>((resolve, reject) => {
            this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='conversation'", (err, row) => {
                resolve(!!row); // Resolve with true if a table named 'conversation'  exists
            });
        });

        // Create tables if they don't exist
        if (!tablesExist) {
            await this.db.run(`CREATE TABLE conversation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
            )`);

            await this.db.run(`CREATE TABLE message (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversationId INTEGER,
                role TEXT,
                content TEXT,
                name TEXT,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                FOREIGN KEY (conversationId) REFERENCES conversation(id)
            )`);
        }
    }

    async startNewConversation(): Promise<number> {
        const result = await this.db.run('INSERT INTO conversation DEFAULT VALUES');
        return result.lastID; 
    }

    async saveMessage(conversationId: number, message: Message): Promise<number> {
        const result = await this.db.run(
            'INSERT INTO message (conversationId, role, content, name, date) VALUES (?, ?, ?, ?, ?)',
            [conversationId, message.role, message.content, message.name, message.date] 
        );
        return result.lastID;
    }

    async getRecentMessages(conversationId: number, numMessages: number = 10, offset: number = 0): Promise<Message[]> {
        const rows = await this.db.all(
            `SELECT * FROM message 
            WHERE conversationId = ? 
                ORDER BY date DESC 
            LIMIT ? OFFSET ?`, 
            [conversationId, numMessages, offset] 
        );
        return rows; // Assuming your logic maps SQL rows to Message objects
    }

    async getAllConversations(): Promise<Conversation[]> {
        const rows = await this.db.all('SELECT * FROM conversation');
        return rows; // Assuming logic maps SQL rows to Conversation objects
    }

}
