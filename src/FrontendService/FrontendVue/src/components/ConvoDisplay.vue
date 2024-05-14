<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import { WebSocketMessage, WebSocketStatus } from '../../LLMService';
import { APIUtils, RetryResponseOutcome } from '../APIUtils';
import { SendRequestInput } from '../../LLMController';

interface MessageIncludeWrapper {
  message: Message;
  shouldInclude: boolean;
}

const props = defineProps<{
  convoId: number | null;
  outgoingPayload?: SendRequestInput | null;
}>();

const emit = defineEmits(['open-websocket', 'close-websocket']);

const messagesWithInclusionFlag: Ref<MessageIncludeWrapper[]> = ref<MessageIncludeWrapper[]>([]);
let webSocket: WebSocket | null = null;

watch(() => props.convoId, (newConvoId, oldConvoId) => {
  if (newConvoId !== oldConvoId) {
    if (newConvoId) {
      fetchInitialMessages(newConvoId);
    } else {
      messagesWithInclusionFlag.value = [];
    }
  }
});

watch(() => props.outgoingPayload, (newOutgoingPayload) => {
  if (newOutgoingPayload) {
    setupWebsocketConnection(newOutgoingPayload);
  }
});

const copyMessage = (message: Message) => {
  navigator.clipboard.writeText(message.content)
};

const regenerateMessage = (message: Message) => {
  // TODO: Implement logic to call AI model for regeneration and update the message with the new response
};

async function fetchInitialMessages(conversationId: number) {
  messagesWithInclusionFlag.value = [];
  if (conversationId !== null) {
    const response: RetryResponseOutcome = await APIUtils.retryGetMessages(conversationId, 10, 0);
    if (response.success) {
      const messages: Message[] = response.value.reverse();
      messages.forEach((message) => {
        messagesWithInclusionFlag.value.push(createMessageWrapper(message));
      });
    } else {
      console.error("Failed to load initial messages");
    }
  }
}

async function setupWebsocketConnection(newOutgoingPayload: SendRequestInput) {
  webSocket = new WebSocket('ws://localhost:8080');
  webSocket.addEventListener('open', async (event) => {
    await handleWebSocketOpen(event, newOutgoingPayload);
  });
  webSocket.addEventListener('close', handleWebSocketClose);
  webSocket.addEventListener('message', handleWebSocketMessage);
}

async function handleWebSocketOpen(_: Event, newOutgoingPayload: SendRequestInput) {
  sendOutgoingPayload(newOutgoingPayload);
  await createUserMessage(newOutgoingPayload);
  addSystemMessage();
  emit('open-websocket');
}

function handleWebSocketMessage(event: MessageEvent) {
  try {
    const message: WebSocketMessage = typeof event.data === 'string' ? JSON.parse(event.data) : null;
    if (message && message.status === WebSocketStatus.Data) {
      messagesWithInclusionFlag.value[messagesWithInclusionFlag.value.length - 1].message.content += message.content;
    }
  } catch (error) {
    console.error('Error parsing WebSocket message:', error);
  }
}

async function handleWebSocketClose(_: CloseEvent): Promise<void> {
  webSocket = null;
  if (messagesWithInclusionFlag.value.length && props.convoId) {
    const lastMessage = messagesWithInclusionFlag.value[messagesWithInclusionFlag.value.length - 1].message;
    const response = await APIUtils.retryPostMessage(lastMessage);
    if (response.success) {
      lastMessage.id = response.value;
    }
  }
  emit('close-websocket');
}

function sendOutgoingPayload(payload: SendRequestInput) {
  const includedMessages = messagesWithInclusionFlag.value
    .filter((wrapper) => wrapper.shouldInclude)
    .map((wrapper) => wrapper.message);
  const outgoingPayload: SendRequestInput = {
    prompt: payload.prompt,
    model: payload.model,
    previousMessages: includedMessages,
  };
  if (webSocket) {
    webSocket.send(JSON.stringify(outgoingPayload));
  }
}

async function createUserMessage(payload: SendRequestInput) {
  const userMessage: Message = {
    id: -1,
    conversationId: props.convoId as number,
    role: 'user',
    content: payload.prompt,
    date: new Date(),
  };
  if (!props.convoId) {
    messagesWithInclusionFlag.value.push(createMessageWrapper(userMessage));
    return;
  }
  const response: RetryResponseOutcome = await APIUtils.retryPostMessage(userMessage);
  if (response.success) {
    userMessage.id = response.value;
    messagesWithInclusionFlag.value.push(createMessageWrapper(userMessage));
  } else {
    // TODO: handle error
  }
}

function createMessageWrapper(message: Message, include = true): MessageIncludeWrapper {
  return { message, shouldInclude: include };
}

function addSystemMessage() {
  messagesWithInclusionFlag.value.push(createMessageWrapper({
    id: -1,
    conversationId: props.convoId as number,
    role: 'system',
    content: '',
    date: new Date(),
  }));
}
</script>

<template>
  <div class="conversation-display">
    <div v-for="wrapper in messagesWithInclusionFlag" :key="wrapper.message.id" class="conversation-message-wrapper">
      <div v-if="wrapper.message.role === 'user'" class="user-message">
        <Card class="user-card">
          <template #content>{{ wrapper.message.content }}</template>
        </Card>
        <div class="message-options">
          <Checkbox v-model="wrapper.shouldInclude" :binary="true" />
        </div>
      </div>
      <div v-else class="system-message">
        <Card class="system-card">
          <template #subtitle>{{ wrapper.message.name }}</template>
          <template #content>{{ wrapper.message.content }}</template>
        </Card>
        <div class="message-options">
          <Checkbox v-model="wrapper.shouldInclude" :binary="true" />
          <Button icon="pi pi-copy" class="p-button-text copy-btn" @click="copyMessage(wrapper.message)" />
          <Button icon="pi pi-refresh" class="p-button-text regen-btn" @click="regenerateMessage(wrapper.message)" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation-display {
  display: flex;
  flex-direction: column;
  margin-left: 15%;
  margin-bottom: 10px;
}

.user-message,
.system-message {
  display: flex;
  width: 100%;
}

.conversation-message-wrapper {
  display: flex;
  flex-direction: row;
}

.message-options {
  margin-left: 10px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.user-card,
.system-card {
  width: 800px;
  min-height: auto;
  margin: 8px 0;
  border: double 3px #ccc;
  border-radius: 8px;
  color: var(--text-color);
  font-family: var(--font-family);
  background-color: var(--surface-card);
}
</style>
