import { LLMController } from "./LLMController";
import WebSocket, { WebSocketServer } from "ws";
import type { SendRequestInput } from "./LLMController"; 
import { ChatCompletionStream } from "openai/lib/ChatCompletionStream";
import { GenerateContentCandidate, GenerateContentStreamResult } from "@google/generative-ai";
import { MessageStream } from "@anthropic-ai/sdk/lib/MessageStream";
import { AnthropicError } from "@anthropic-ai/sdk/error";
import { APIUserAbortError, OpenAIError } from "openai/error";

// if status = error, then error content, otherwise string
export interface WebSocketMessage {
  status: WebSocketStatus;
  content?: string | ErrorContent;  
}

export interface ErrorContent {
  errorName: string;
  errorMessage: string;
  errorCode?: number;
}

export enum WebSocketStatus {
  Role, // ATM of writing only openAIModels have this 
  Data,
  BlockStart,
  BlockEnd,
  Error
}

export class LLMService {
    private llmController: LLMController;
    private server: WebSocketServer; 
    private readonly PORT: number = 8080;
    private isServerStarted: boolean = false;
    private isBlockOpen: boolean = false;
    
    constructor() {
        this.llmController = new LLMController();        
        this.startServer();
    }


    private startServer(): void {
        if (!this.isServerStarted) {
            this.isServerStarted = true;
            this.server = new WebSocketServer({ port: this.PORT });
            this.server.on('connection', (clientWebSocket) => {
                clientWebSocket.on('message', this.handleMessage.bind(this, clientWebSocket));
                clientWebSocket.on('close', this.close.bind(this, clientWebSocket));
                clientWebSocket.on('error', this.handleError.bind(this, clientWebSocket));
            });
        }
    }


    private async handleMessage(ws: WebSocket, message: string): Promise<void> {
        try {
            const payload = JSON.parse(message);
            if (this.validSendRequestInput(payload)) {
                const model = payload.model;
                if (this.llmController.openAIModels.has(model)) {
                    await this.handleOpenAIModel(ws, payload);
                } else if (this.llmController.anthropicModels.has(model)) {
                    await this.handleAnthropicModel(ws, payload);
                } else if (this.llmController.geminiModels.has(model)) {
                    await this.handleGeminiModel(ws, payload);
                } else {
                    this.sendError(ws, "ModelError", "No valid model matching provided", 1003);
                }
            } else {
                this.sendError(ws, "PayloadError", "Payload doesn't match SendRequestInput interface", 1003);
            }
        } catch (err) {
            console.error(err);
            this.sendError(ws, "InternalError", "Unexpected internal server error", 1010);
        }
    }


    private async handleOpenAIModel(ws: WebSocket, payload: any): Promise<void> {
        const streamResponse: ChatCompletionStream = await this.llmController.sendOpenAIAPIRequest(payload);
        for await (const chunk of streamResponse) {
            try {
                const chunkChoices = chunk.choices[0];
                const chunkStopReason = chunkChoices?.finish_reason || "";
                const chunkDelta = chunk.choices[0]?.delta;
                const chunkContent  = chunkDelta?.content || "";
                const chunkRole = chunkDelta?.role || "";
                if (chunkRole) { // the initial chunk sent is just a role, following ones are content/end/error
                    this.sendDataWithStatus(ws, WebSocketStatus.Role, chunkRole); 
                } else if (chunkContent) {
                    this.sendDataWithStatus(ws, WebSocketStatus.Data, chunkContent)
                } 
                if (chunkStopReason) {
                    if (chunkStopReason == "length") {
                        ws.close(1000, "length");
                    } else if (chunkStopReason === "stop") {
                        ws.close(1000, "stop");
                    }
                }
            } catch (err: any) {
                console.error("Error during streaming: ", err);
                this.sendError(ws, err.name, err.message, err.code);
            }
        }
    }

    // TODO delete logs outside of errors 
    private async handleAnthropicModel(ws: WebSocket, payload: any): Promise<void> {
        const streamResponse: MessageStream = this.llmController.sendAnthropicAPIRequest(payload)
        streamResponse
        .on('text', (text: string) => {
            this.sendDataWithStatus(ws, WebSocketStatus.Data, text);
        }).on('contentBlock', (contentBlock) => {
            const blockStatus: WebSocketStatus.BlockStart | WebSocketStatus.BlockEnd 
                = this.isBlockOpen ? WebSocketStatus.BlockStart : WebSocketStatus.BlockEnd;
            this.isBlockOpen = !this.isBlockOpen;
            this.sendDataWithStatus(ws, blockStatus, contentBlock.text)
        }).on('end', () => {
            ws.close(1000, "stop");
        }).on('error', (err: AnthropicError) => {
            console.error(err);
            this.sendError(ws, err.name, err.message);
            ws.close(1011, "error");
        }).on('abort', (err) => {
            this.sendError(ws, err.name, err.message)
            ws.close(1000, "aborted");
        });
    }


    private async handleGeminiModel(ws: WebSocket, payload: any): Promise<void> {
        const streamResponse: GenerateContentStreamResult = await this.llmController.sendGeminiAPIRequest(payload);
        try {
            for await (const chunk of streamResponse.stream) {
                const chunkText: string = chunk.text();
                this.sendDataWithStatus(ws, WebSocketStatus.Data, chunkText);
                if (chunk.candidates) {
                    const chunkCandidate: GenerateContentCandidate = chunk.candidates[0];
                    if (chunkCandidate.finishReason) {
                        this.close();
                    }
                    /*
                       Possible finish reasons 
                       TODO send a msg to client w/ this info, other handle methods require this also
                       FINISH_REASON_UNSPECIFIED = "FINISH_REASON_UNSPECIFIED",
                       STOP = "STOP",
                       MAX_TOKENS = "MAX_TOKENS",
                       SAFETY = "SAFETY",
                       RECITATION = "RECITATION",
                       OTHER = "OTHER"
                    */
                }
            }
        } catch (err) {
            console.error("Error in handleGeminiModel: ", err);
            this.sendError(ws, err.name, err.message, err.code);
        }
    }

    private sendError(ws: WebSocket, errorName: string, errorMessage: string = "Unexpected internal server error", errorCode: number = 1010): void {
        const errorContent: ErrorContent = {
            errorName: errorName,
            errorMessage: errorMessage,
            errorCode: errorCode
        };
        this.sendDataWithStatus(ws, WebSocketStatus.Error, errorContent);
        this.handleError(errorCode, errorMessage, false);
    }

    private sendDataWithStatus(ws: WebSocket, status: WebSocketStatus, content:string | ErrorContent): void {
        const webSocketMessage: WebSocketMessage = {
            status: status,
            content: content
        }
        ws.send(JSON.stringify(webSocketMessage));
    }

    private validSendRequestInput(payload: any): payload is SendRequestInput {
        return 'model' in payload && typeof payload.model === 'string' &&
            'prompt' in payload && typeof payload.prompt === 'string'; 
    }

    private shutdownClientsOrServer(closeCode: number, closeMessage: string, closeServer: boolean = true): void {
        if (this.isServerStarted) {
            this.server.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.close(closeCode, closeMessage);
                }
            });

            if (closeServer) {
                this.server.close(() => {
                    console.log('WebSocket server has been shut down.');
                });
                this.isServerStarted = false;
            }
        }
    }

    public close(): void {
        this.shutdownClientsOrServer(1001, 'Server shutdown'); 
    }
    
    private handleError(errorCode: number = 1010, errorMessage: string = "Unexpected server error", closeServer: boolean = false): void {
        this.shutdownClientsOrServer(errorCode, errorMessage, closeServer);
    }

} 


