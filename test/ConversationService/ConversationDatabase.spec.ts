import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
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

  beforeEach( () => {
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
    const nonExistentConversationId = -5;
    const newName = 'Updated Conversation';

    expect(() => db.updateConversationName(nonExistentConversationId, newName)).toThrowError();
  });

  it('should save and retrieve a message, providing it with an ID',  () => {
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
  
  it('should save and retrieve multiple messages',  () => {
      const conversationId = db.startNewConversation().id;
      expect(db.getConversationById(conversationId)).toBeDefined();

      // Generate and save 4 messages with staggered timestamps
      const messages: Message[] = [];
      for (let i = 1; i <= 4; i++) {
          const message: Message = {
              id: -1,
              conversationId,
              role: i % 2 === 0 ? 'system' : 'user',
              content: `Message ${i}`,
              name: i % 2 === 0 ? 'Assistant' : 'Test User',
              date: new Date(Date.now() + i * 50), // Ensure unique timestamp
          };
          const providedId = db.saveMessage(message);
          message.id = providedId;
          messages.push(message);
      }

      const recentMessages = db.getRecentMessages(conversationId, 3);
      expect(recentMessages.length).toBe(3);
      expect(recentMessages).toEqual(messages.splice(1,5).reverse());
  });

  it('should save and retrieve multiple messages with offset',  () => {
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
          const providedId = db.saveMessage(message);
          message.id = providedId;
          messages.push(message);
      }

      // Fetch messages with offset of 5, default limit of 10
      const fetchedMessages = db.getRecentMessages(conversationId, undefined, 5);
      expect(fetchedMessages.length).toBe(10);
      expect(fetchedMessages).toEqual(messages.slice(0,10).reverse());
  })

  it('should provide all available and not an error if numMessages < numRequestedMessages + offset', () => {
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
              date: new Date(Date.now() + i * 50),
          };
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

  it('should retrieve all conversations', () => {
      const conversation1 = db.startNewConversation();
      const conversation2 = db.startNewConversation();
      const conversations: Conversation[] = db.getAllConversations();
      expect(conversations.length).toBe(2);
      expect(conversations).toContainEqual(conversation1);
      expect(conversations).toContainEqual(conversation2);
  });
});
