export {};

declare global {
    interface Message {
        role: 'user' | 'system';
        content: string;
        name?: string; 
        severity?: 'warning' | 'error';
        date: Date;
        id: number; 
    }
}
