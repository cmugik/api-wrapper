import axios from 'axios';

export interface RetryResponseOutcome {
    success: boolean;
    value: any;
}

export class APIUtils {
    static async retryPostMessage(message: Message, maxRetries = 5): Promise<RetryResponseOutcome> {
        return this.retryRequest(() => axios.post(`http://localhost:3001/api/messages`, message), maxRetries);
    }

    static async retryGetMessages(conversationId: number, limit: number = 10, offset: number = 0, maxRetries = 5): Promise<RetryResponseOutcome> {
        return this.retryRequest(() => axios.get(`http://localhost:3001/api/messages?conversationId=${conversationId}&offset=${offset}&limit=${limit}`), maxRetries);
    }

    static async retryPostConversation(conversation: Conversation, maxRetries = 5): Promise<RetryResponseOutcome> {
        return this.retryRequest(() => axios.post(`http://localhost:3001/api/conversations`, conversation), maxRetries);
    }

    static async retryGetConversation(conversationId: number, maxRetries = 5): Promise<RetryResponseOutcome> {
        return this.retryRequest(() => axios.get(`http://localhost:3001/api/conversations/${conversationId}`), maxRetries);
    }

    private static async retryRequest(requestFunc: () => Promise<any>, maxRetries: number): Promise<RetryResponseOutcome> {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const response = await requestFunc();
                if (response.status >= 200 && response.status < 300) {
                    return { success: true, value: response.data };
                } else {
                    throw new Error(`Request failed with status: ${response.status}`);
                }
            } catch (error) {
                attempt++;
                console.error(`Attempt ${attempt}: Request failed. Error:`, error);
                if (attempt >= maxRetries) {
                    console.error("Max retries reached, giving up: ", error);
                    return { success: false, value: -1 };
                }
                const delay = attempt * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        return { success: false, value: -1 }; // Shouldn't be reached, satisfying compiler
    }
}

export default APIUtils;

