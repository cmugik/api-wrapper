<script setup lang="ts">
import { SendRequestInput } from '../LLMController';
import ConvoDisplay from './components/ConvoDisplay.vue';
import ModelConvoDisplay from './components/ModelConvoDisplay.vue';
import UserInputDisplay from './components/UserInputDisplay.vue'
import { ref, type Ref } from 'vue'

const selectedConversationId: Ref<number | null> = ref<number | null>(null);

const outgoingPayload: Ref<SendRequestInput | null> = ref<SendRequestInput | null>(null);

const isStreamingActive: Ref<boolean> = ref<boolean>(false);

const handleConversationSelect = (convoIdOrNull: number | null) => {
  selectedConversationId.value = convoIdOrNull;
};

const handleSendMessage = (payload: SendRequestInput) => {
  outgoingPayload.value = payload;
}

const toggleStreamingOn = () => {
  isStreamingActive.value = true;
}

const toggleStreamingOff = () => {
  isStreamingActive.value = false;
}

</script>
<template>
  <div class="container">
    <div class="left-column">
      <div class="convo-frame">
        <ConvoDisplay :convoId="selectedConversationId" :outgoingPayload="outgoingPayload"
          @open-websocket="toggleStreamingOn" @close-websocket="toggleStreamingOff" />
      </div>
      <div class="user-input-frame">
        <UserInputDisplay :isStreamingActive="isStreamingActive" @send-message="handleSendMessage" />
      </div>
    </div>
    <div class="model-convo-frame">
      <ModelConvoDisplay :isStreamingActive="isStreamingActive" @convo-selected="handleConversationSelect" />
    </div>
  </div>
</template>
<style scoped>
html,
body {
  height: 100%;
  width: 100%;
  margin: 0;
}

.container {
  display: flex;
  flex-direction: row;
}

.left-column {
  display: flex;
  flex-direction: column;
}

.convo-frame {
  display: flex;
  overflow: auto;
  flex-direction: column-reverse;
  justify-items: flex-start;
  align-items: start;
  width: 1200px;
  height: 832px;
  border: 2px solid #ccc;
  background-color: var(--surface-ground);
}

.user-input-frame {
  width: 1200px;
  height: 192px;
  border: 2px solid #ccc;
  background-color: var(--surface-ground);
}

.model-convo-frame {
  width: 348px;
  height: 1024px;
  border: 2px solid #ccc;
  background-color: var(--surface-ground);
}
</style>
