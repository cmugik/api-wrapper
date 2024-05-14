<script setup lang="ts">
import { SendRequestInput } from '../LLMController';
import ConvoDisplay from './components/ConvoDisplay.vue';
import ModelConvoDisplay from './components/ModelConvoDisplay.vue';
import UserInputDisplay from './components/UserInputDisplay.vue'
import Toast from 'primevue/toast';
import { ref, type Ref } from 'vue'

const selectedConversationId: Ref<number | null> = ref<number | null>(null);

const outgoingPayload: Ref<SendRequestInput | null> = ref<SendRequestInput | null>(null);

const isStreamingActive: Ref<boolean> = ref<boolean>(false);

const selectBoxesMode: Ref<boolean | null> = ref<boolean | null>(null);

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

const handleSelectBoxesMode = (newSelectBoxesMode: boolean) => {
  console.log("HIT APP.Vue", newSelectBoxesMode);
  selectBoxesMode.value = newSelectBoxesMode;
}

const handleSelectBoxesComplete = () => {
  selectBoxesMode.value = null;
}

</script>
<template>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <div class="container">
    <Toast />
    <div class="left-column">
      <div class="convo-frame">
        <ConvoDisplay :convoId="selectedConversationId" :outgoingPayload="outgoingPayload"
          :selectBoxesMode="selectBoxesMode" @open-websocket="toggleStreamingOn" @close-websocket="toggleStreamingOff"
          @select-boxes-complete="handleSelectBoxesComplete" />
      </div>
      <div class="user-input-frame">
        <UserInputDisplay :isStreamingActive="isStreamingActive" @send-message="handleSendMessage"
          @select-boxes-mode="handleSelectBoxesMode" />
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
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

.container {
  display: flex;
  padding: 0;
  margin: 0;
  flex-direction: row;
  min-height: 100vh;
  width: 100vw;
}

.left-column {
  display: flex;
  flex-direction: column;
  flex: 4;
}

.convo-frame {
  display: flex;
  overflow: auto;
  flex-direction: column-reverse;
  justify-items: flex-start;
  align-items: start;
  border: 2px solid #ccc;
  background-color: var(--surface-ground);
  flex-grow: 1;
}

.user-input-frame {
  border: 2px solid #ccc;
  background-color: var(--surface-ground);
}

.model-convo-frame {
  flex: 1;
  border: 2px solid #ccc;
  background-color: var(--surface-ground);
}
</style>
