import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Message {
  role: 'user' | 'system';
  content: string;
  name?: string;
}

interface SendRequestInput {
  model: string;
  prompt: string;
  previousMessages?: Message[];
}


/**
 * Orchestrates the communication with LLM APIs, including sending requests and handling responses.
 */
class LLMController {

    private openAI: OpenAI;
    private anthropic: Anthropic;
    private gemini;

    /**
     * Creates an instance of LLMController.
     * @param apiUtil Utility class for making HTTP requests to LLM APIs.
     */
    constructor(private apiUtil: APIUtil) {
        this.openaiAPI = new OpenAI(process.env.OPENAI_API_KEY);
        this.anthropic = new Anthropic({
            apiKey: process.env['ANTHROPIC_API_KEY'], 
        });       
        this.gemini = new GoogleGenerativeAI(process.env.apiKey);
    }

    sendRequest(payload: SendRequestInput): Promise<any> {
        const openAiModels = ['gpt-4-turbo', 'gpt-4-32k', 'gpt-4', 'gpt-3.5-turbo'];
        const claudeModels = ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
        const geminiModels = ['models/gemini-1.5-pro-latest', 'models/gemini-pro'];

        const model = payload.model;

        if (openAiModels.includes(model)) {
            sendOpenAIAPIRequest(payload);
        } else if (claudeModels.includes(model)) {
            sendAnthropicAPIRequest(payload);
        } else if (geminiModels.includes(model)) {
            sendGeminiAPIRequest(payload);
        } else {
            // post an error
        }

    /**
     * Sends a request to the openAI API with the provided payload.
     * @param payload The payload to send to the openAI API.
     * @returns A promise that resolves with the response from the openAI API.
     */
    sendOpenAIAPIRequest(payload: SendRequestInput): Promise<any> {
        const currentMessage = {role:"user", content: payload.prompt};
        const messages = [...(payload.previousMessages ?? []), currentMessage];

        await this.retry(async () => {
            const completion = await openai.chat.completions.create({
                model: payload.model,
                messages: messages,
                stream: true,
                max_tokens: 2048,
            });

            for await (const chunk of completion) {
                // send to front end in chunks (w/ special indicator for finish?)
            }
        }, 3);  
    }

    /**
     * Sends a request to the anthropic API with the provided payload.
     * @param payload The payload to send to the anthropic API.
     * @returns A promise that resolves with the response from the anthropic API.
     */
    sendAnthropicAPIRequest(payload: SendRequestInput): Promise<any> {
        const currentMessage = {role: "user", content: payload.prompt};
        const messages = [...(payload.previousMessages ?? []), currentMessage];

        await this.retry(async () => {
            const completion = await this.anthropic.complete({
                model: payload.model,
                prompt: messages, 
                stream: true,
                max_tokens: 2048 // Adjust max_tokens as needed
            }); 

            for await (const chunk of completion.responses) {
                // send to front end in chunks w/ special indicator for completion afterwards
            }
        }, 3);   
    }

    /**
     * Sends a request to the gemini API with the provided payload.
     * @param payload The payload to send to the gemini API.
     * @returns A promise that resolves with the response from the gemini API.
     */
    async sendGeminiAPIRequest(payload: SendRequestInput): Promise<any> {
        const model = gemini.getGenerativeModel({ model: payload.model });
        const restructedMessages = restructureMessagesForGemini(previousMessages);
        const chat = model.startChat({
            history: restructedMessages,
            generationConfig: {
                maxOutputTokens: 2048,
            }
        })
        await this.retry(async () => {
            const result = await chat.sendMessageStream(payload.prompt); 
            let text = ""; 
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                // send chunkText to front end w/ specialn indicator for completion afterwards 
                text += chunkText;
            }

        }, 3);
    }

    function restructureMessagesForGemini(previousMessages: Message[]): { role: string, parts: { text: string }[] }[] {
        return previousMessages.map(message => ({
            role: message.role,
            parts: [{ text: message.content }] 
        }));
    }

    /**
     * Handles the response from the LLM API, including any parsing or error checking.
     * @param response The response from the LLM API to handle.
     * @returns The processed response.
     */
    handleResponse(response: any): any {
        // Implementation
    }

    /**
     * Implement retry logic for requests.
     * @param attemptFunction The function representing the attempt.
     * @param retries Number of retries.
     * @returns A promise that resolves with the successful attempt's result.
     */
    retry<T>(attemptFunction: () => Promise<T>, retries: number = 3): Promise<T> {
        let lastError: Error | null = null;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await attemptFunction();
                return; 
            } catch (error) {
                lastError = error;
                console.log(`Attempt ${attempt} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
            }
        }
        throw lastError;
    }

}

