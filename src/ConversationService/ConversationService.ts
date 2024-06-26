import { ConversationDatabase } from './ConversationDatabase';
import express, { Express, Request, Response } from 'express';
import { retryAsync } from 'ts-retry';

export class ConversationService {
    private app: Express;
    private db: ConversationDatabase;
    private readonly FRONTENDPORT: number = 5173; // TODO unhardcode this
    private readonly PORT: number = 3001;
    private isRoutesSetup: boolean = false;
    private isServerStarted: boolean = false;

    constructor() {
        this.db = new ConversationDatabase();
        this.app = express();
        this.app.use(express.json()); // Middleware to parse JSON bodies
        const cors = require('cors');
        this.app.use(cors({
            origin: 'http://localhost:' + this.FRONTENDPORT,
        }));
    }

    public async initialize() {
        retryAsync(async () => {
            try {
                await this.db.initialize();
                this.setupRoutes();
                console.log("All routes up");
                this.startServer();
                console.log("Conversation Service Server setup complete");
            } catch (err) {
                console.error('Error initializing ConversationService:', err);
            }
        },
            {
                maxTry: 3,
                delay: 200,
                onMaxRetryFunc(err) {
                    console.error('Failed 3 times initializing ConversationService:', err);
                },
            });
    }

    public async shutdown() {
        try {
            await this.db.close();
        } catch (err) {
            console.error('Failed shutdown of ConversationService, likely because Database is in use/stalled:', err);
        }
    }

    private setupRoutes(): void {
        // Message Routes
        if (this.isRoutesSetup == false) {
            this.isRoutesSetup = true;

            // shoots back ID in data
            this.app.post('/api/messages', (req, res) => this.saveMessage(req, res));
            // shoots back array of messages in data
            this.app.get('/api/messages', (req, res) => this.getRecentMessages(req, res));

            // shoots back the conversation in data
            this.app.post('/api/conversations', (req, res) => this.startConversation(req, res));
            // shoots back array of conversations in data
            this.app.get('/api/conversations', (req, res) => this.getAllConversations(req, res));
        }
    }

    private startServer(): void {
        if (this.isServerStarted == false) {
            this.isServerStarted = true;
            this.app.listen(this.PORT, () => {
                console.log(`Server is running at http://localhost:${this.PORT}`);
            });
        }
    }

    // Message Controllers
    private async saveMessage(req: Request, res: Response) {
        try {
            const message: Message = this.parseMessageFromRequestBody(req.body);
            const savedMessageId = this.db.saveMessage(message);
            res.status(201).json(savedMessageId);
        } catch (err) {
            console.error('failed to save message', err);
            res.status(500).json({ error: 'failed to save message' });
        }
    }

    private async getRecentMessages(req: Request, res: Response) {
        const { conversationId, offset = 0, limit = 10 } = req.query;
        try {
            if (!conversationId) {
                throw new Error('Didn\'t include a conversationId');
            }
            const recentMessages = this.db.getRecentMessages(Number(conversationId), Number(limit), Number(offset));
            res.status(200).json(recentMessages);
        } catch (err) {
            console.error('failed to retrieve messages', err);
            res.status(500).json({ error: 'failed to retrieve messagess' });
        }
    }

    // Conversation Controllers
    private async startConversation(req: Request, res: Response) {
        try {
            const requestedName = req.body.name?.trim();
            const newConversation: Conversation = requestedName ? this.db.startNewConversation(requestedName) : this.db.startNewConversation();
            res.status(201).json(newConversation);
        } catch (err) {
            console.error('failed to start conversation', err);
            res.status(500).json({ error: 'failed to start conversation' });
        }
    }

    private async getAllConversations(req: Request, res: Response) {
        try {
            const conversations = this.db.getAllConversations();
            res.status(200).json(conversations);
        } catch (err) {
            console.error('failed to retrieve conversations', err);
            res.status(500).json({ error: 'failed to retrieve conversations' });
        }
    }

    public parseMessageFromRequestBody(requestBody: any): Message {
        return {
            role: requestBody.role as 'user' | 'system',
            content: requestBody.content,
            name: requestBody.name || undefined,
            severity: requestBody.severity as 'warning' | 'error' | undefined,
            date: new Date(requestBody.date as string),
            id: requestBody.id,
            conversationId: requestBody.conversationId,
        };
    }

    // testing only
    public emptyTables(): void {
        this.db.emptyTables();
    }

}


