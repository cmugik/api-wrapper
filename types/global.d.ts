declare global {

    interface Message {
        role: 'user' | 'system' | 'assistant';
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

}
export { Message, Conversation }
