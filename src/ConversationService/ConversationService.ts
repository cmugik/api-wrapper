import { ConversationDatabase } from './ConversationDatabase';
import  { Router, Request, Response } from 'express';

export class ConversationService {
  private conversationDatabase: ConversationDatabase;

  constructor() {
    this.conversationDatabase = new ConversationDatabase();
  }

  public async initialize() {
      await this.conversationDatabase.initialize();
  }

}
