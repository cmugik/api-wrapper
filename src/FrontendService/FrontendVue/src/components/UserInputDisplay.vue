<script setup lang="ts">
import { ref, watch } from 'vue';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import { SendRequestInput } from '../../LLMController';

const props = defineProps<{
  isStreamingActive: boolean
}>();

const emit = defineEmits<{
  (e: 'send-message', outgoingPayload: SendRequestInput): void;
  (e: 'cancel-streaming'): void;
}>();

const message = ref('');
const isStreaming = ref(false);

watch(
  () => props.isStreamingActive,
  (newIsStreamingBool) => {
    isStreaming.value = newIsStreamingBool;
  }
);

function sendMessage() {
  const messageValue: string = message.value;
  const outgoingPayload: SendRequestInput = {
    prompt: messageValue,
    model: "gpt-3.5-turbo", // TODO update this with a dropbox
    previousMessages: [],
  }
  message.value = '';
  emit('send-message', outgoingPayload);
}

function cancelStreaming() {
  emit("cancel-streaming");
}

</script>
<template>
  <div class="user-input-display">
    <Textarea class="text-area" v-model="message" placeholder="Type here..." />
    <Button v-if="!isStreaming" color="primary" @click="sendMessage"><i class="pi pi-send"></i></Button>
    <Button v-else color="error" @click="cancelStreaming"><i class="pi pi-spin pi-spinner"></i></Button>
  </div>
</template>
<style scoped>
.user-input-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 50px;
  height: 192px;
}

.text-area {
  width: 800px;
  box-sizing: border-box;
  border-width: 2px;
  height: 80%;
  margin-right: 10px;
  resize: none;
}
</style>
