import { describe, it, beforeAll, beforeEach, expect } from 'vitest';
import type { SendRequestInput } from '../../src/LLMCommunicationService/LLMController';
import { AnthropicModels, GeminiModels, LLMController, OpenAIModels } from '../../src/LLMCommunicationService/LLMController'; 
import type { Message } from '../../types/global';
import { ChatCompletionStream } from 'openai/lib/ChatCompletionStream';
import { GenerateContentStreamResult } from '@google/generative-ai';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';

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
        payload.prompt = "respond with a number from 00-99 followed by a short quote from the year 19XX";
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

    it('should make a call to openAI API with history', async () => {
        console.log("TEST OpenAI API call with history STARTED");
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
console.log("TEST OpenAI API call with history ENDED");
    });

    it('should make a call to openAI API without history', async () => {
console.log("TEST OpenAI API call without history STARTED");
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
console.log("TEST OpenAI API call with history ENDED");
    });

    it('should make a call to anthropic API with history', async () => {
        console.log("TEST Anthropics API call with history STARTED");
        payload.model = AnthropicModels['claude-3-haiku'];
        toAnthropicRoles(payload);
        const streamResponse: MessageStream = controller.sendAnthropicAPIRequest(payload);
        let numChunks = 0;
        for await (const messageStreamEvent of streamResponse) {
            expect(messageStreamEvent).toBeDefined();
            console.log(messageStreamEvent);
            numChunks++;
        }
        expect(numChunks).toBeGreaterThan(0);
        console.log("TEST Anthropics API call with history ENDED");
    });

    it('should make a call to anthropic API without history', async () => {
        console.log("TEST Anthropics API call without history STARTED");
        payload.model = AnthropicModels['claude-3-haiku'];
        toAnthropicRoles(payload);
        payload.previousMessages = [];
        const streamResponse: MessageStream  = controller.sendAnthropicAPIRequest(payload);
        let numChunks = 0;
        for await (const messageStreamEvent of streamResponse) {
            expect(messageStreamEvent).toBeDefined();
            console.log(messageStreamEvent);
            numChunks++;
        }
        expect(numChunks).toBeGreaterThan(0);
        console.log("TEST Anthropics API call without history ENDED");
    });

    it('should make a call to gemini API with history', async () => {
        console.log("TEST Gemini API call with history STARTED");
        payload.model = GeminiModels['gemini-1.0-pro'];
        toGeminiRoles(payload);
        const streamResponse: GenerateContentStreamResult = await controller.sendGeminiAPIRequest(payload);        
        let numChunks = 0;
        for await (const chunk of streamResponse.stream) {
            const chunkText = chunk.text();
            console.log(chunkText);
            numChunks++;
        }
        expect(numChunks).toBeGreaterThan(0);
        console.log("TEST Gemini API call with history ENDED");
    });

    it('should make a call to gemini API without history', async () => {
        console.log("TEST Gemini API call without history STARTED");
        payload.model = GeminiModels['gemini-1.0-pro'];
        toGeminiRoles(payload);
        payload.previousMessages = [];
        const streamResponse: GenerateContentStreamResult = await controller.sendGeminiAPIRequest(payload);        
        let numChunks = 0;
        for await (const chunk of streamResponse.stream) {
            const chunkText = chunk.text();
            console.log(chunkText);
            numChunks++;
        }
        expect(numChunks).toBeGreaterThan(0);
        console.log("TEST Gemini API call without history ENDED");
    }); 

    it('should work for each and every model', async () => {
       // for now didn't write it dont want to risk getting spammed with gpt-4 test credits xd 
    });

});

