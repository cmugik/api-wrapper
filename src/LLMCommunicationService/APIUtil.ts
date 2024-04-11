class APIUtil {
    // Base URL for the LLM API
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    /**
     * Makes a streaming GET request using Server-Sent Events.
     * @param endpoint The endpoint for the streaming request.
     * @param params Optional query parameters for the request.
     * @returns An EventSource instance for handling streaming data.
     */
    streamGet(endpoint: string, params?: Record<string, any>): EventSource {
        // Implementation
    }

    /**
     * Makes a POST request with an option for streaming response.
     * @param endpoint The endpoint to send data to.
     * @param body The body of the request.
     * @returns A promise that resolves with the response data or a streaming EventSource.
     */
    post(endpoint: string, body: any): Promise<any> | EventSource {
        // Adjusted implementation to support streaming
    } 

    /**
     * Implement rate limiting mechanism.
     */
    rateLimit(): void {
        // Implementation
    }

    /**
     * Implement retry logic for requests.
     * @param attemptFunction The function representing the attempt.
     * @param retries Number of retries.
     * @returns A promise that resolves with the successful attempt's result.
     */
    retry<T>(attemptFunction: () => Promise<T>, retries: number = 3): Promise<T> {
        // Implementation
    }
}
  
