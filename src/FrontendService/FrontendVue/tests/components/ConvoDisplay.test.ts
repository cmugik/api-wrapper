import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import ConvoDisplay from '../../src/components/ConvoDisplay.vue';
import { ConversationService } from '../../ConversationService/ConversationService'
import { LLMService } from '../../LLMService/LLMService'
import { WebSocketMessage } from '../../LLMService/LLMService';
import WebSocket from 'ws';
import axios, { Axios } from 'axios';
import { Conversation } from '../../src/global'

describe('ConvoDisplay.vue', () => {

    let convoService: ConversationService;
    let llmService: LLMService;

    const spinUpConvoService = async () => {
        if (convoService) {
            await convoService.shutdown();
        }
        convoService = new ConversationService();
        convoService.initialize();
    }

    const spinUpLLMService = () => {
        if (llmService) {
            llmService.close();
        }
        llmService = new LLMService();
    }

    // Unit Test for copyMessage 
    it('should copy message to clipboard on copy button clicked', async () => {
        const message = { content: 'blablabla' };

        const clipboardWriteTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
        clipboardWriteTextSpy.mockResolvedValue(); 

        const wrapper = mount(ConvoDisplay);
        await wrapper.find('.copy-btn').trigger('click'); 

        expect(clipboardWriteTextSpy).toHaveBeenCalledWith(message.content);
    });
    

    it('should have # messages = to that of the conversation Id passed into props, or 0 if no prop', async () => {
        await spinUpConvoService();
        const conversationResponse = await axios.post('http://localhost:3001/api/conversations');
        const conversation: Conversation = {
            ...conversationResponse.data,
            createdAt: new Date(conversationResponse.data.createdAt),
        };
        const convoId = conversation.id;
        const messageArr: Message[] = [];
        for (let i = 1; i <= 10; i++) {
            const role = i % 2 === 1 ? 'user' : 'system';
            const content = role === 'user' ? `Hello from user ${i}` : `Response from system ${i}`;
            const date = new Date(Date.now() + i*50);
            const message: Message = {
                id: -1,
                conversationId: convoId,
                role: role,
                content: content,
                date: date
            };
            const messageResponse = await axios.post('http://localhost:3001/api/messages', message);
            message.id = messageResponse.data;
            messageArr.push(message);
        }

        const wrapper = mount(ConvoDisplay, {
            propers: {
                convoId: conversation.id,
            }
        })

        const numUserMessagesExpected = 5;
        const numSysMessagesExpected = 5;
        expect(wrapper.findAll('.user-message').length).toBe(numUserMessagesExpected);
        expect(wrapper.findAll('.system-message').length).toBe(numSysMessagesExpected);
    });

    it ('should receive live updates on a newly streamed message', async () => {
        
    })

// Component Test for message regeneration
//    it('should provide different and non empty new message', async () => {
//    });

    // On Open/Close webSocket, onChunkStreamed;
   it('should add an empty message, lock the input box(not tested?) new message should get chunk change, then it should unlock box after final',
     async () => {

     });
});
