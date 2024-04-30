import { describe, it, beforeAll, beforeEach, expect } from 'vitest';
import type { SendRequestInput } from '../../src/LLMCommunicationService/LLMController';
import { AnthropicModels, GeminiModels, LLMController, OpenAIModels } from '../../src/LLMCommunicationService/LLMController'; 
import type { Message } from '../../types/global';
import { ChatCompletionStream } from 'openai/lib/ChatCompletionStream';
import { MessageStreamEvent } from '@anthropic-ai/sdk/resources';
import { Stream } from '@anthropic-ai/sdk/streaming';
import { GenerateContentStreamResult } from '@google/generative-ai';

describe('LLMController', () => {

    const toAnthropicRoles = (payload: any) => {
        if (payload.previousMessages) {
            for (let i = 0; i < 4; i++) {
                i % 2 === 0 ? payload.previousMessages[i].role = 'user' : payload.previousMessages[i].role = 'assistant';
            }
        }
    }

    const toOpenAIRoles = (payload: any) => {
        if (payload.previousMessages) {
            for (let i = 0; i < 4; i++) {
                i % 2 === 0 ? payload.previousMessages[i].role = 'user' : payload.previousMessages[i].role = 'system';
            }
        }
    }

    const toGeminiRoles = (payload: any) => {
        if (payload.previousMessages) {
            for (let i = 0; i < 4; i++) {
                i % 2 === 0 ? payload.previousMessages[i].role = 'user' : payload.previousMessages[i].role = 'model';
            }
        }
    }

    let controller: LLMController;
    let payload: SendRequestInput; 

    beforeAll(() => {
        controller = new LLMController(); 
        payload = {
            prompt: "",
            model: "",
            previousMessages: []
        }
    });

    beforeEach(() => {
        payload.model = "";
        payload.prompt = "final msg! respond with a number from 2-81";
        const previousMsgs: Message[] = [];
        const conversationId = 1; 

        for (let i = 0; i < 4; i++) {
            const role = i % 2 === 0 ? 'user' : 'system'; 
            const message: Message = {
                role: role,
                content: `This is a ${role} message.`,
                date: new Date(Date.now() + i * 1000), 
                id: i + 1, 
                conversationId: conversationId,
            };
            previousMsgs.push(message);
        }    

        payload.previousMessages = previousMsgs;
    })

    it('should throw an error if you call w/ a bad model', async () => {
        payload.model = 'guy in east asia';
        try {
            const _ = await controller.sendRequest(payload);
            expect(true).toBeFalsy();
        } catch (err) {
            // good
        }
    })
    
    it('should make a call to openAI API with history', async () => {
       payload.model = OpenAIModels['gpt-3.5-turbo'];
       toOpenAIRoles(payload);
       const streamResponse: ChatCompletionStream = await controller.sendOpenAIAPIRequest(payload);
       let numChunks = 0;
       for await (const chunk of streamResponse) {
           expect(chunk).toBeDefined();
           console.log(chunk);
           numChunks++;
       }
       expect(numChunks).toBeGreaterThan(0);

    });

    it('should make a call to openAI API without history', async () => {
       payload.model = OpenAIModels['gpt-3.5-turbo'];
       toOpenAIRoles(payload);
       payload.previousMessages = [];
       const streamResponse: ChatCompletionStream = await controller.sendOpenAIAPIRequest(payload);
       let numChunks = 0;
       for await (const chunk of streamResponse) {
           expect(chunk).toBeDefined();
           console.log(chunk);
           numChunks++;
       }
       expect(numChunks).toBeGreaterThan(0);
    });

    it('should make a call to anthropic API with history', async () => {
        payload.model = AnthropicModels['claude-3-haiku'];
        toAnthropicRoles(payload);
        const streamResponse: Stream<MessageStreamEvent> = await controller.sendAnthropicAPIRequest(payload);
        let numChunks = 0;
        for await (const messageStreamEvent of streamResponse) {
            expect(messageStreamEvent).toBeDefined();
            console.log(messageStreamEvent);
            numChunks++;
        }
        expect(numChunks).toBeGreaterThan(0);
    });

    it('should make a call to anthropic API without history', async () => {
        payload.model = AnthropicModels['claude-3-haiku'];
        toAnthropicRoles(payload);
        payload.previousMessages = [];
        const streamResponse: Stream<MessageStreamEvent> = await controller.sendAnthropicAPIRequest(payload);
        let numChunks = 0;
        for await (const messageStreamEvent of streamResponse) {
            expect(messageStreamEvent).toBeDefined();
            console.log(messageStreamEvent);
            numChunks++;
        }
        expect(numChunks).toBeGreaterThan(0);
    });

    it('should make a call to gemini API with history', async () => {
        payload.model = GeminiModels['gemini-1.0-pro'];
        toGeminiRoles(payload);
        const streamResponse: GenerateContentStreamResult = await controller.sendGeminiAPIRequest(payload);        
        let numChunks = 0;
        for await (const chunk of streamResponse.stream) {
            const chunkText = chunk.text;
            console.log(chunkText);
            numChunks++;
        }
        expect(numChunks).toBeGreaterThan(0);
    });

    it('should make a call to gemini API without history', async () => {
        payload.model = GeminiModels['gemini-1.0-pro'];
        toGeminiRoles(payload);
        payload.previousMessages = [];
        const streamResponse: GenerateContentStreamResult = await controller.sendGeminiAPIRequest(payload);        
        let numChunks = 0;
        for await (const chunk of streamResponse.stream) {
            const chunkText = chunk.text;
            console.log(chunkText);
            numChunks++;
        }
        expect(numChunks).toBeGreaterThan(0);
    }); 

    it('should work for each and every model', async () => {
       // for now didn't write it dont want to risk getting spammed with gpt-4 test credits xd 
    });

});

