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
        createdAt: string;
    }

}
export { Message, Conversation }