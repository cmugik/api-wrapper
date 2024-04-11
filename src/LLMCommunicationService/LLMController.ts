
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

    /**
     * Creates an instance of LLMController.
     * @param apiUtil Utility class for making HTTP requests to LLM APIs.
     */
    constructor(private apiUtil: APIUtil) {
        this.openaiAPIKey = new OpenAI(process.env.OPENAI_API_KEY);
        // this.anthropicAPIKey = new ...
    }

    /**
     * Sends a request to the LLM API with the provided payload.
     * @param payload The payload to send to the LLM API.
     * @returns A promise that resolves with the response from the LLM API.
     */
    sendOpenAIAPIRequest(payload: SendRequestInput): Promise<any> {
        const currentMessage = {role:user, content: payload.prompt};
        const messages = [...(payload.previousMessages ?? []), currentMessage];
        const completion = await openai.chat.completions.create({
            model: payload.model,
            messages: payload.previousMessages,
            stream: true,
        });

        for await (const chunk of completion) {
            // communicate w/ front end
        }
    }

    /**
     * Handles the response from the LLM API, including any parsing or error checking.
     * @param response The response from the LLM API to handle.
     * @returns The processed response.
     */
    handleResponse(response: any): any {
        // Implementation
    }
}

