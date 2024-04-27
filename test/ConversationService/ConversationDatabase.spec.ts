import fs from 'fs';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, expectTypeOf } from 'vitest';
import { ConversationDatabase } from '../../src/ConversationService/ConversationDatabase';
import { Conversation, Message } from '../../types/global';
describe('ConversationDatabase', () => {
  let db: ConversationDatabase;

  beforeAll(async () => {
      db = new ConversationDatabase();
      await db.initialize();
      db.emptyTables();
      await db.close();
  })

  beforeEach(async () => {
    db = new ConversationDatabase();
  });

  afterEach(async () => {
    db.emptyTables();
    await db.close();
  });

  afterAll(() => {
      try {
          //fs.unlinkSync("./conversations.db");
      } catch (err) {
          console.error(err);
      }
  })

  it('should create and initialize the database', async () => {
    expect(await db.checkTablesExist()).toBe(true);
  });

  it('should start a new conversation with no name', () => {
      const conversation: Conversation = db.startNewConversation();
      expect(conversation.id).toBeGreaterThan(0); 
      expect(conversation.name).toBeFalsy();
      expect(conversation.createdAt).toBeInstanceOf(Date);
      const conversations: Conversation[] = db.getAllConversations();
      expect(conversations).toContainEqual(conversation);
  });

  it('should start a new conversation with a name', () => {
      const conversation: Conversation = db.startNewConversation('name123');
      expect(conversation.id).toBeGreaterThan(0); 
      expect(conversation.name).toBe('name123');
      expect(conversation.createdAt).toBeInstanceOf(Date);
      const conversations: Conversation[] = db.getAllConversations();
      expect(conversations).toContainEqual(conversation);
  })

  it('should update the conversation name, and re-request it by id', () => {
    const conversation: Conversation = db.startNewConversation();
    const newName = 'Updated Conversation';

    db.updateConversationName(conversation.id, newName);

    const updatedConversation: Conversation = db.getConversationById(conversation.id);
    expect(updatedConversation.name).toBe(newName);
  });

  it('should throw an error if the conversation does not exist', () => {
    const nonExistentConversationId = 999;
    const newName = 'Updated Conversation';

    expect(() => db.updateConversationName(nonExistentConversationId, newName)).toThrowError();
  });

  it('should save and retrieve a message, providing it with an ID', async () => {
    const conversationId = db.startNewConversation().id;
    const message: Message = {
      id: -1,
      conversationId,
      role: 'user',
      content: 'Hello, world!',
      name: 'Test User',
      date: new Date(),
    };
    const providedId: number = db.saveMessage(message);
    message.id = providedId;
    const messages = db.getRecentMessages(conversationId);
    expect(messages.length).toBe(1);
    expect(messages[0]).toEqual(message);
  });
  
  it('should save and retrieve multiple messages', async () => {
  const conversationId: number = db.startNewConversation().id;

  const message1: Message = {
    id: -1,
    conversationId,
    role: 'user',
    content: 'Hello, world!',
    name: 'Test User',
    date: new Date(),
  };
  await new Promise(resolve => setTimeout(resolve, 50));
  const message2: Message = {
    id: -1,
    conversationId,
    role: 'system',
    content: 'Hi there!',
    name: 'Assistant',
    date: new Date(),
  };
  await new Promise(resolve => setTimeout(resolve, 50));
  const message3: Message = {
    id: -1,
    conversationId,
    role: 'user',
    content: 'How are you?',
    name: 'Test User',
    date: new Date(),
  };
  await new Promise(resolve => setTimeout(resolve, 50));
  const message4: Message = {
    id: -1,
    conversationId,
    role: 'system',
    content: 'I\'m doing well, thanks for asking!',
    name: 'Assistant',
    date: new Date(),
  };

  const providedId1 = db.saveMessage(message1);
  const providedId2 = db.saveMessage(message2);
  const providedId3 = db.saveMessage(message3);
  const providedId4 = db.saveMessage(message4);

  message1.id = providedId1;
  message2.id = providedId2;
  message3.id = providedId3;
  message4.id = providedId4;

  const messages = db.getRecentMessages(conversationId, 3);
  expect(messages.length).toBe(3);
  expect(messages).toEqual([message4, message3, message2]);
  })

  it('should save and retrieve multiple messages with offset', async () => {
      const conversationId = db.startNewConversation().id;

      // Generate and save 15 messages with staggered timestamps
      const messages: Message[] = [];
      for (let i = 1; i <= 15; i++) {
          const message: Message = {
              id: -1,
              conversationId,
              role: i % 2 === 0 ? 'system' : 'user',
              content: `Message ${i}`,
              name: i % 2 === 0 ? 'Assistant' : 'Test User',
              date: new Date(Date.now() + i * 50), // Ensure unique timestamp
          };
          await new Promise(resolve => setTimeout(resolve, 25)); // Short delay
          const providedId = db.saveMessage(message);
          message.id = providedId;
          messages.push(message);
      }

      // Fetch messages with offset of 5, default limit of 10
      const fetchedMessages = db.getRecentMessages(conversationId, undefined, 5);
      expect(fetchedMessages.length).toBe(10);
      expect(fetchedMessages).toEqual(messages.slice(0,10).reverse());
  })

  it('should provide all available and not an error if numMessages < numRequestedMessages + offset', async () => {
      const conversationId = db.startNewConversation().id;

      // Generate and save 20 messages with staggered timestamps
      const messages: Message[] = [];
      for (let i = 1; i <= 20; i++) {
          const message: Message = {
              id: -1,
              conversationId,
              role: i % 2 === 0 ? 'system' : 'user',
              content: `Message ${i}`,
              name: i % 2 === 0 ? 'Assistant' : 'Test User',
              date: new Date(),
          };
          await new Promise(resolve => setTimeout(resolve, 25)); // Short delay
          const providedId = db.saveMessage(message);
          message.id = providedId;
          messages.push(message);
      }
      const fetchedMessagesShouldBeLessThanRequested = db.getRecentMessages(conversationId, 15, 10);
      const fetchedMessagesShouldBeEmpty = db.getRecentMessages(conversationId, 10, 500);
      expect(fetchedMessagesShouldBeLessThanRequested.length).toBe(10); // not 15
      expect(fetchedMessagesShouldBeLessThanRequested).toEqual(messages.slice(0,10).reverse());
      expect(fetchedMessagesShouldBeEmpty.length).toBe(0);
  })

  it('should retrieve all conversations', async () => {
      const conversation1 = db.startNewConversation();
      const conversation2 = db.startNewConversation();
      const conversations: Conversation[] = db.getAllConversations();
      expect(conversations.length).toBe(2);
      expect(conversations).toContainEqual(conversation1);
      expect(conversations).toContainEqual(conversation2);
  });
});
