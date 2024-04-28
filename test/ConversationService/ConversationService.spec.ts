import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { ConversationService } from '../../src/ConversationService/ConversationService';
import { Conversation, Message } from '../../types/global';
import axios from 'axios';
describe('ConversationService', () => {
    let serv: ConversationService;

    beforeAll(async () => {
        serv = new ConversationService();
        await serv.initialize();
    });

    afterAll(async () => {
        await serv.shutdown();
    });

    afterEach(async () => {
        serv.emptyTables();
    })

    it('should start a new conversation with no name', async () => {
        const response = await axios.post('http://localhost:3001/api/convo/start');
        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        const conversation: Conversation = {
            ...response.data,
            createdAt: new Date(response.data.createdAt),
        };
        expect(conversation.id).toBeGreaterThan(0); 
        expect(conversation.name).toBeFalsy();
        expect(conversation.createdAt).toBeInstanceOf(Date);
    });

    it('should start a new conversation with a name', async () => {
        const testName: string = "josephname";
        const response = await axios.post('http://localhost:3001/api/convo/start', {
            name: testName
        });
        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        const conversation: Conversation = {
            ...response.data,
            createdAt: new Date(response.data.createdAt),
        };
        expect(conversation.id).toBeGreaterThan(0); 
        expect(conversation.name).toBe(testName);
        expect(conversation.createdAt).toBeInstanceOf(Date);
    });

    it('should save a valid message to the database', async () => {
        const conversationResponse = await axios.post('http://localhost:3001/api/convo/start');
        const conversationId = conversationResponse.data.id;

        const message1: Message = {
            id: -1,
            conversationId,
            role: 'user',
            content: 'Hello, world!',
            name: 'Test User',
            date: new Date(),
        };

        const response = await axios.post('http://localhost:3001/api/msg/save', message1);

        expect(response.status).toBe(201);
        expect(response.data).toBeTypeOf("number");
    });

    it('should retrieve recent messages with correct ordering', async () => {
        const conversationResponse = await axios.post('http://localhost:3001/api/convo/start');
        const convoId: number = conversationResponse.data.id;

        const messageArr: Message[] = [];

        for (let i = 0; i < 20; i++) {
            const role = i % 2 === 0 ? 'user' : 'system';
            const name = role === 'user' ? 'Test User' : 'CursorBot';
            const content = role === 'user' ? `Hello from user ${i}` : `Response from system ${i}`;
            const date = new Date(Date.now() + i*50);

            const message: Message = {
                id: -1,
                conversationId: convoId,
                role: role,
                content: content,
                name: name,
                date: date
            };

            const messageResponse = await axios.post('http://localhost:3001/api/msg/save', message);
            message.id = messageResponse.data;
            messageArr.push(message);
        }
        const requestMessageResponse = await axios.get(`http://localhost:3001/api/msg/getRecent?conversationId=${convoId}&offset=5&limit=10`);
        // should have the 10 messages that are offset by 5 - so messages 19-15 are out, we are getting messages 14-5 in that order
        const responseArr: Message[] = [];
        for (const response of requestMessageResponse.data) {
           responseArr.push(serv.parseMessageFromRequestBody(response)); 
        }
        const expectedArr: Message[] = messageArr.slice(5,15).reverse(); 
        expect(requestMessageResponse.status).toBe(200);
        expect(responseArr).toEqual(expectedArr);
    });


    it('should retrieve all conversations', async () => {
        const conversations: Conversation[] = [];
        for (let i = 0; i < 5; i++) {
            const response = await axios.post('http://localhost:3001/api/convo/start');
            expect(response.status).toBe(201);
            const conversation: Conversation = response.data;
            conversations.push(conversation);
        }

        const response = await axios.get('http://localhost:3001/api/convo/getAll');

        expect(response.status).toBe(200);
        expect(response.data).toHaveLength(5);

        for (let i = 0; i < 5; i++) {
            expect(response.data[i]).toMatchObject(conversations[i]);
        }
    });

    it('should gracefully handle errors when saving a message', async () => {
        try {
            await axios.post('http://localhost:3001/api/msg/save', {});
            expect(false).toBe(true);
        } catch (errorResponse) {
            expect(errorResponse.response.status).toBe(500);
        }
        const conversationResponse = await axios.post('http://localhost:3001/api/convo/start');
        expect(conversationResponse.status).toBe(201);
    });

    it('should gracefully handle retrieval when no messages exist', async () => {
        const conversationResponse = await axios.post('http://localhost:3001/api/convo/start');
        const convoId = conversationResponse.data.id;

        const response = await axios.get(`http://localhost:3001/api/msg/getRecent?conversationId=${convoId}&offset=0&limit=10`);
            expect(response.status).toBe(200);
        expect(response.data).toHaveLength(0);
    });

    it('should gracefully handle retrieval when no conversations exist', async () => {
        const response = await axios.get('http://localhost:3001/api/convo/getAll');
        expect(response.status).toBe(200);
        expect(response.data).toHaveLength(0);
    });

})
