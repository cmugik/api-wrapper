import { describe, it, beforeAll, beforeEach, afterEach, expect } from 'vitest';
import { LLMService, WebSocketMessage } from '../../src/LLMCommunicationService/LLMService'
import type { Message } from '../../types/global';
import WebSocket from 'ws';
import { AnthropicModels, GeminiModels, OpenAIModels } from '../../src/LLMCommunicationService/LLMController';

describe('LLMService', () => {
    let serv: LLMService; 
    let wsClient: WebSocket;;
    let payload: any;

    const toAnthropicRoles = (payload: any) => {
        if (payload.previousMessages) {
            for (let i = 0; i < 2; i++) {
                i % 2 === 0 ? payload.previousMessages[i].role = 'user' : payload.previousMessages[i].role = 'assistant';
            }
        }
    }

    const toOpenAIRoles = (payload: any) => {
        if (payload.previousMessages) {
            for (let i = 0; i < 2; i++) {
                i % 2 === 0 ? payload.previousMessages[i].role = 'user' : payload.previousMessages[i].role = 'system';
            }
        }
    }

    const toGeminiRoles = (payload: any) => {
        if (payload.previousMessages) {
            for (let i = 0; i < 2; i++) {
                i % 2 === 0 ? payload.previousMessages[i].role = 'user' : payload.previousMessages[i].role = 'model';
            }
        }
    }

    beforeEach(async () => {
        serv = new LLMService(); 
        const previousMessages: Message[] = [
            {
                role: 'user',
                content: 'joe says hi',
                date: new Date(),
                id: 1,
                conversationId: 1
            },
            {
                role: 'system',
                content: 'hi joe!',
                date: new Date(),
                id: 2,
                conversationId: 1
            }
        ];
        payload = { 
            prompt: "respond with a number from 00-99, followed by a short quote from the year 19xx, where xx is the number",
            model: "", previousMessages: previousMessages 
        };

        wsClient = new WebSocket('ws://localhost:8080');
        await new Promise((resolve, reject) => {
            wsClient.on('open', resolve);
            wsClient.on('close', reject);
        });
    });    

    afterEach(() => {
        wsClient.close();
        serv.close();
    })

    async function collectAndCheckContent(): Promise<WebSocketMessage[]> {
        const responses: WebSocketMessage[] = [];
        return new Promise((resolve, reject) => {
            wsClient.on('message', (data: string) => {
                const parsedData: WebSocketMessage = JSON.parse(data);
                // console.log("Parsed Status: ", parsedData.status, "Parsed Content: ", parsedData.content);
                responses.push(parsedData);
            });
            wsClient.on('close', () => {
                responses.forEach(response => expect(response).toBeTruthy());
                resolve(responses);
            });
            wsClient.on('error', reject);
        });
    }

    it('should stream chunks back from openai API request with no history', async () => {
        payload.model = OpenAIModels['gpt-3.5-turbo'];
        payload.previousMessages = [];
        wsClient.send(JSON.stringify(payload));
        const finalResponses: any[] = await collectAndCheckContent();
        console.log(finalResponses);
        expect(finalResponses.length).toBeGreaterThan(0);  
    });

    it('should stream chunks back from openai API request with history', async () => {
        payload.model = OpenAIModels['gpt-3.5-turbo'];
        toOpenAIRoles(payload);
        wsClient.send(JSON.stringify(payload));
        const finalResponses = await collectAndCheckContent();
        console.log(finalResponses);
        expect(finalResponses.length).toBeGreaterThan(0);  
    });

    it('should stream chunks back from anthropic api request w/ no history', async () => {
        payload.model = AnthropicModels['claude-3-haiku'];
        payload.previousMessages = [];
        wsClient.send(JSON.stringify(payload));
        const finalResponses = await collectAndCheckContent();
        console.log(finalResponses);
        expect(finalResponses.length).toBeGreaterThan(0);  
    });

    it('should stream chunks back from anthropic api request w/ history', async () => {
        payload.model = AnthropicModels['claude-3-haiku'];
        toAnthropicRoles(payload);
        wsClient.send(JSON.stringify(payload));
        const finalResponses = await collectAndCheckContent();
        console.log(finalResponses);
        expect(finalResponses.length).toBeGreaterThan(0);  
    });

    it('should stream chunks back from gemini api request w/ no history', async () => {
        payload.model = GeminiModels['gemini-1.0-pro'];
        payload.previousMessages = [];
        wsClient.send(JSON.stringify(payload));
        const finalResponses = await collectAndCheckContent();
        console.log(finalResponses);
        expect(finalResponses.length).toBeGreaterThan(0);
    })

    it('should stream chunks back from gemini api request w/ history', async () => {
        payload.model = GeminiModels['gemini-1.0-pro'];
        toGeminiRoles(payload);
        wsClient.send(JSON.stringify(payload));
        const finalResponses = await collectAndCheckContent();
        console.log(finalResponses);
        expect(finalResponses.length).toBeGreaterThan(0);
    })

    /*
       it('should not respond back with significantly more words than max tokens (factor=1.25)', async () => {

       })
    */
})
