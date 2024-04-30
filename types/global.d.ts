declare global {

    interface Message {
        role: 'user' | 'system';
        content: string;
        name?: string; 
        severity?: 'warning' | 'error';
        date: Date;
        id: number; 
        conversationId: number;
    }

    interface Conversation {
        id: number;
        name: string;
        createdAt: Date;
    }

    enum OpenAIModels {
        "gpt-3.5-turbo" = "gpt-3.5-turbo",
        "gpt-4-turbo" = "gpt-4-turbo",
        "gpt-4-vision" = "gpt-4-vision-preview",
        "gpt-4" = "gpt-4",
        "gpt-4-32k" = "gpt-4-32k",
    }


    enum GeminiModels {
        "gemini-1.0-pro" = "gemini-1.0-pro-latest",
        "gemini-1.0-pro-vision" = "gemini-1.0-pro-vision-latest",
        "gemini-1.5-pro" = "gemini-1.5-pro-latest",
    }

    enum ClaudeModels {
       "claude-3-opus" = "claude-3-opus-20240229",
       "claude-3-sonnet" = "claude-3-sonnet-20240229",
       "claude-3-haiku" = "claude-3-haiku-20240307"
    }

}
export { Message, Conversation }
