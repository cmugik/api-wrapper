import * as dotenv from 'dotenv';
import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { GenerateContentStreamResult, GoogleGenerativeAI } from "@google/generative-ai";
import { retryAsync } from "ts-retry";
import type { ChatCompletionStream } from "openai/lib/ChatCompletionStream";
import type { Stream } from "@anthropic-ai/sdk/streaming";
import type { MessageStreamEvent } from "@anthropic-ai/sdk/resources";
import type { Message } from "../../types/global.d.ts";

    export enum OpenAIModels {
        "gpt-3.5-turbo" = "gpt-3.5-turbo",
        "gpt-4-turbo" = "gpt-4-turbo",
        "gpt-4-vision" = "gpt-4-vision-preview",
        "gpt-4" = "gpt-4",
        "gpt-4-32k" = "gpt-4-32k",
    }


    export enum GeminiModels {
        "gemini-1.0-pro" = "gemini-1.0-pro-latest",
        "gemini-1.0-pro-vision" = "gemini-1.0-pro-vision-latest",
        "gemini-1.5-pro" = "gemini-1.5-pro-latest",
    }

    export enum AnthropicModels {
       "claude-3-opus" = "claude-3-opus-20240229",
       "claude-3-sonnet" = "claude-3-sonnet-20240229",
       "claude-3-haiku" = "claude-3-haiku-20240307"
    }

export interface SendRequestInput {
  model: string;
  prompt: string;
  previousMessages?: Message[];
}

export class LLMController {

    private openAI: OpenAI;
    private anthropic: Anthropic;
    private gemini: GoogleGenerativeAI;
    private openAIModels: Set<string>;
    private geminiModels: Set<string>;
    private anthropicModels: Set<string>;

    constructor() {
        dotenv.config(); 
        this.openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });       
        this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        this.openAIModels = new Set(Object.values(OpenAIModels));
        this.geminiModels = new Set(Object.values(GeminiModels));
        this.anthropicModels = new Set(Object.values(AnthropicModels));
    }

    public sendRequest(payload: SendRequestInput):
        Promise<ChatCompletionStream> | 
        Promise<Stream<MessageStreamEvent>> |
        Promise<GenerateContentStreamResult> {
        const model = payload.model;
        if (this.openAIModels.has(model)) {
            return this.sendOpenAIAPIRequest(payload);
        } else if (this.anthropicModels.has(model)) {
            return this.sendAnthropicAPIRequest(payload);
        } else if (this.geminiModels.has(model)) {
            return this.sendGeminiAPIRequest(payload);
        } else {
            console.error("Model doesn't match any existing models");
            throw new Error("Model doesn't match any existing models");
        }
    }

    public async sendOpenAIAPIRequest(payload: SendRequestInput): Promise<ChatCompletionStream> {
        if (!this.openAIModels.has(payload.model)) { 
            throw new Error("bad model");
        }
        const currentMessage = {role:"user", content: payload.prompt};
        const simplifiedMessages = this.restructureMessages(payload.previousMessages, currentMessage); 
        const chatCompletionParams: OpenAI.Chat.ChatCompletionCreateParams = 
            {
            messages: simplifiedMessages,
            model: payload.model,
            stream: true,
            max_tokens: 4096
        };
        let stream: ChatCompletionStream;
        return await retryAsync(async () => {
            stream = this.openAI.beta.chat.completions.stream(chatCompletionParams);
            return stream;
        }, {
            maxTry: 3,
            delay: 2000
        });  
    }

    /**
     * Sends a request to the anthropic API with the provided payload.
     * @param payload The payload to send to the anthropic API.
     * @returns A promise that resolves with the response from the anthropic API.
     */
    public async sendAnthropicAPIRequest(payload: SendRequestInput): Promise<Stream<MessageStreamEvent>> {
        if (!this.anthropicModels.has(payload.model)) {
            throw new Error("bad model");
        }
        const currentMessage = {role: "user", content: payload.prompt};
        const simplifiedMessages = this.restructureMessages(payload.previousMessages, currentMessage);
        const chatCompletionParams: Anthropic.MessageCreateParams = {
                messages: simplifiedMessages,
                model: payload.model,
                stream: true,
                max_tokens: 2048 
        }
        return await retryAsync(async () => {
            const stream: Stream<MessageStreamEvent> = await this.anthropic.messages.create(chatCompletionParams); 
            return stream;
        }, { 
            maxTry: 3,
            delay: 2000
        }); 
    }

    
    public async sendGeminiAPIRequest(payload: SendRequestInput): Promise<GenerateContentStreamResult> {
        if (!this.geminiModels.has(payload.model)) {
            throw new Error("bad model");
        }
        const model = this.gemini.getGenerativeModel({ model: payload.model });
        const restructuredMessage = this.restructureMessagesForGemini(payload.previousMessages, payload.prompt);
        return await retryAsync(async () => {
            return await model.startChat().sendMessageStream(restructuredMessage);
        }, {
            maxTry: 3,
            delay: 2000,
        });
    }

    private restructureMessages(previousMessages: Message[], currentMessage: any): any { 
        const simplifiedMessages = previousMessages.map(({ content, role }) => ({
            content, role } as {content: string, role: string }));
        simplifiedMessages.push(currentMessage);
        return simplifiedMessages 
    } 

    private restructureMessagesForGemini(previousMessages: Message[], currentMessage: string): any {
        let finalMessage = "";
        let msgNum = 1;
        for (const msg of previousMessages) {
            const { role, content } = msg;
            finalMessage += `MessageNo: ${msgNum}\nRole: ${role}\nContent: ${content}\n`;
            msgNum++;
        }        
        finalMessage += `Current-User-Message: ${currentMessage}`;
    }

}

