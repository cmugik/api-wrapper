<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watch } from 'vue';
  import type { Ref } from 'vue';
  import Button from 'primevue/button';
  import Card from 'primevue/card';
  import WebSocket, { type CloseEvent, type Event, type MessageEvent } from 'ws';
  import axios from 'axios';

interface Props {
  convoId: number | null,
  outgoingPrompt: string,
}

const messages: Ref<Message[]> = ref<Message[]>([]);

const props = defineProps<Props>();

const currentConversation = ref<Conversation | null>(null);

let webSocket: WebSocket | null = null;

watch(
  () => props.convoId,
  (newConvoId, oldConvoId) => {
    if (newConvoId !== oldConvoId) {
      if (newConvoId) {
        loadInitialMessages(newConvoId);
      } else {
        currentConversation.value = null;
      }
    }
  }
);

watch(
  () => props.outgoingPrompt,
  (newOutgoingPrompt, oldOutgoingPrompt) => {
      webSocket = new WebSocket('ws://localhost:8080');
    webSocket.addEventListener('open', (event) => {
      onOpenWebSocket(event);
    });
    webSocket.addEventListener('close', (event) => {
      onCloseWebSocket(event);
    });
    webSocket.addEventListener('message', (event) => {
      onChunkStreamed(event); 
    });
  }
);

const copyMessage = (message: Message) => {
  navigator.clipboard.writeText(message.content).then(() => {
    // TODO show a success message/feedback?
  });
}

const regenerateMessage = (message: Message) => {
  // TODO Implement logic to call AI model for regeneration
  // Update the message with the new response
}

async function loadInitialMessages(conversationId: number) {
  loadMessages(conversationId, 10, 0);
}

// TODO flip the array so loading previous = just as simple as adding 10 to back but adding new is the O(n) op
async function loadMessages(conversationId: number, limit: number = 10, offset: number = 10) {
  const messageResponse = await axios.get(
  `http://localhost:3001/api/messages?conversationId=${conversationId}&offset=${offset}&limit=${limit}`
  );
  const responseStatus = messageResponse.status;
  if (responseStatus == 200) {
    messages.value = messageResponse.data;
  }
}

function onOpenWebSocket(openEvent: Event) {
// create a new empty message on top of the conversation, lock edits in the input box
}

function onCloseWebSocket(closeEvent: CloseEvent) {
// release the lock on the input box and set websocket = null
}

function onChunkStreamed(chunk: MessageEvent) {
// update the most recent message by appending chunk to end of convo
}

</script>
<template>
  <div class="conversation-display">
    <div class="conversation-message-wrapper" v-for="message in messages" :key="message.id">
      <div v-if="message.role === 'user'" class="user-message">
        <Card class="user-card">
        <template #content> {{message.content}} </template>
        </Card>
      </div>
      <div v-else class="system-message">
        <Card class="system-card">
        <template #subtitle> {{message.name}} </template>
        <template #content> {{message.content}} </template>
        </Card>
          <Button icon="pi pi-copy" class="p-button-text copy-btn" @click="copyMessage(message)" />
          <Button icon="pi pi-refresh" class="p-button-text regen-btn" @click="regenerateMessage(message)" />
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
  display:flex;
  width: 100%;
}
.user-card,
.system-card {
  width: 800px; 
  min-height: auto; /* vertical resizing */ 
  margin: 8px 0;
  border: double 3px #ccc; /* Double line, 3px thickness */
  border-radius: 8px;
  color: var(--text-color);
  font-family: var(--font-family);
  background-color: var(--surface-card);
}
</style>
