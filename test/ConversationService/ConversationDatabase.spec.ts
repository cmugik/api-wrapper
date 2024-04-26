import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
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

  it('should create and initialize the database', async () => {
    expect(await db.checkTablesExist()).toBe(true);
  });

  it('should start a new conversation', () => {
    const conversationId = db.startNewConversation();
    expect(typeof conversationId).toBe('number');
  });

  it('should save and retrieve a message, providing it with an ID', async () => {
    const conversationId = db.startNewConversation();
    const message: Message = {
      id: -1,
      conversationId,
      role: 'user',
      content: 'Hello, world!',
      name: 'Test User',
      date: new Date(),
    };
    const providedId: number = await db.saveMessage(message);
    message.id = providedId;
    const messages = await db.getRecentMessages(conversationId);
    expect(messages.length).toBe(1);
    expect(messages[0]).toEqual(message);
  });
  
  it('should save and retrieve multiple messages', async () => {
  const conversationId = db.startNewConversation();

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

  const providedId1 = await db.saveMessage(message1);
  const providedId2 = await db.saveMessage(message2);
  const providedId3 = await db.saveMessage(message3);
  const providedId4 = await db.saveMessage(message4);

  message1.id = providedId1;
  message2.id = providedId2;
  message3.id = providedId3;
  message4.id = providedId4;

  const messages = await db.getRecentMessages(conversationId, 3);
  expect(messages.length).toBe(3);
  expect(messages).toEqual([message4, message3, message2]);
  })

  it('should save and retrieve multiple messages with offset', async () => {
      const conversationId = db.startNewConversation();

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
          const providedId = await db.saveMessage(message);
          message.id = providedId;
          messages.push(message);
      }

      // Fetch messages with offset of 5, default limit of 10
      const fetchedMessages = await db.getRecentMessages(conversationId, undefined, 5);
      expect(fetchedMessages.length).toBe(10);
      expect(fetchedMessages).toEqual(messages.slice(0,10).reverse());
  })

  it('should provide all available and not an error if numMessages < numRequestedMessages + offset', async () => {
      const conversationId = db.startNewConversation();

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
          const providedId = await db.saveMessage(message);
          message.id = providedId;
          messages.push(message);
      }
      const fetchedMessagesShouldBeLessThanRequested = await db.getRecentMessages(conversationId, 15, 10);
      const fetchedMessagesShouldBeEmpty = await db.getRecentMessages(conversationId, 10, 500);
      expect(fetchedMessagesShouldBeLessThanRequested.length).toBe(10); // not 15
      expect(fetchedMessagesShouldBeLessThanRequested).toEqual(messages.slice(0,10).reverse());
      expect(fetchedMessagesShouldBeEmpty.length).toBe(0);
  })

  it('should retrieve all conversations', async () => {
      const conversationId1 = db.startNewConversation();
      const conversationId2 = db.startNewConversation();
      const conversations: Conversation[] = await db.getAllConversations();
      expect(conversations.length).toBe(2);
      expect(conversations.map((c) => c.id)).toContain(conversationId1);
      expect(conversations.map((c) => c.id)).toContain(conversationId2);
  });
});
