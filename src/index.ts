import { config } from "dotenv";
import { ConversationService } from "./ConversationService/ConversationService";
import { LLMService } from "./LLMCommunicationService/LLMService";


config()
const convoService = new ConversationService
convoService.initialize();
const llmService = new LLMService
