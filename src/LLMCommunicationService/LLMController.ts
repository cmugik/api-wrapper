import * as dotenv from 'dotenv';
import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { GenerateContentStreamResult, GoogleGenerativeAI } from "@google/generative-ai";
import { retryAsync } from "ts-retry";
import type { ChatCompletionStream } from "openai/lib/ChatCompletionStream";
import type { Message } from "../../types/global.d.ts";
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream.js';

export enum OpenAIModels {
    "gpt-3.5-turbo" = "gpt-3.5-turbo",
    "gpt-4-turbo" = "gpt-4-turbo",
    "gpt-4-vision" = "gpt-4-vision-preview",
    "gpt-4" = "gpt-4",
    "gpt-4-32k" = "gpt-4-32k",
    "gpt-4o" = "gtp-4o"
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
    public openAIModels: Set<string>;
    public geminiModels: Set<string>;
    public anthropicModels: Set<string>;

    constructor() {
        dotenv.config();
        this.openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        this.openAIModels = new Set(Object.values(OpenAIModels));
        this.geminiModels = new Set(Object.values(GeminiModels));
        this.anthropicModels = new Set(Object.values(AnthropicModels));
    }

    public async sendOpenAIAPIRequest(payload: SendRequestInput): Promise<ChatCompletionStream> {
        if (!this.openAIModels.has(payload.model)) {
            throw new Error("bad model");
        }
        const currentMessage = { role: "user", content: payload.prompt };
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

    public sendAnthropicAPIRequest(payload: SendRequestInput): MessageStream {
        if (!this.anthropicModels.has(payload.model)) {
            throw new Error("bad model");
        }
        const currentMessage = { role: "user", content: payload.prompt };
        const simplifiedMessages = this.restructureMessages(payload.previousMessages, currentMessage);
        const chatCompletionParams: Anthropic.MessageCreateParams = {
            messages: simplifiedMessages,
            model: payload.model,
            stream: true,
            max_tokens: 2048
        }
        return this.anthropic.messages.stream(chatCompletionParams);
    }


    public async sendGeminiAPIRequest(payload: SendRequestInput): Promise<GenerateContentStreamResult> {
        if (!this.geminiModels.has(payload.model)) {
            throw new Error("bad model");
        }
        const model = this.gemini.getGenerativeModel({ model: payload.model });
        const restructuredMessage = this.restructureMessagesForGemini(payload.previousMessages, payload.prompt);
        return model.generateContentStream(restructuredMessage);
    }

    // gets rid of extraneous data
    private restructureMessages(previousMessages: Message[], currentMessage: any): any {
        const simplifiedMessages = previousMessages ?
            previousMessages.map(({ content, role }) => ({ content, role } as { content: string, role: string })) :
            [];
        simplifiedMessages.push(currentMessage);
        return simplifiedMessages;
    }

    // generates a single concatenated msg composing of past msgs + roles
    private restructureMessagesForGemini(previousMessages: Message[], currentMessage: string): string {
        let finalMessage = "";
        let msgNum = 1;
        for (const msg of previousMessages) {
            const { role, content } = msg;
            finalMessage += `MessageNo: ${msgNum}\nRole: ${role}\nContent: ${content}\n`;
            msgNum++;
        }
        return finalMessage += `Current-User-Message: ${currentMessage}`;
    }

}

