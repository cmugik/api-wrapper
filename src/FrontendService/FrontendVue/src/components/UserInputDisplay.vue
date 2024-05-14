<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import { SendRequestInput } from '../../LLMController';
import { OpenAIModels, GeminiModels, AnthropicModels } from '../../LLMController';

const props = defineProps<{
  isStreamingActive: boolean
}>();

const emit = defineEmits<{
  (e: 'send-message', outgoingPayload: SendRequestInput): void;
  (e: 'cancel-streaming'): void;
  (e: 'select-boxes-mode', mode: boolean): void;
}>();

const message = ref('');
const isStreaming = ref(false);
const currentModel: Ref<AnthropicModels | GeminiModels | OpenAIModels> = ref<AnthropicModels | GeminiModels | OpenAIModels>(OpenAIModels['gpt-3.5-turbo']);

const models = [
  ...Object.values(OpenAIModels),
  ...Object.values(GeminiModels),
  ...Object.values(AnthropicModels)
];

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
  emit('cancel-streaming');
}

function selectAll() {
  console.log("HIT select");
  emit('select-boxes-mode', true);
}

function deselectAll() {
  console.log("HIT deselect");
  emit('select-boxes-mode', false);
}

</script>
<template>
  <div class="user-input-display">
    <div class="input-container">
      <Dropdown v-model="currentModel" :options="models" placeholder="Select a Model" />
      <Textarea class="text-area" v-model="message" placeholder="Type here..." />
    </div>
    <div class="send-select-wrapper">
      <Button @click="selectAll" color="primary"> <i class="pi pi-plus"></i> </Button>
      <Button v-if="!isStreaming" color="primary" @click="sendMessage"> <i class="pi pi-send"></i> </Button>
      <Button v-else color="error" @click="cancelStreaming"> <i class="pi pi-spin pi-spinner"></i> </Button>
      <Button @click="deselectAll" color="primary"><i class="pi pi-times"></i> </Button>
    </div>
  </div>
</template>
<style scoped>
.user-input-display {
  display: flex;
  align-items: center;
  padding: 16px 50px;
  height: 192px;
}

.input-container {
  display: flex;
  align-items: center;
  width: 900px;
  height: 80%;
  gap: 10px;
  margin-right: 10px;
}

.input-container .p-dropdown {
  width: 140px;
  flex-shrink: 0;
}

.text-area {
  flex-grow: 1;
  box-sizing: border-box;
  border-width: 2px;
  height: 100%;
  resize: none;
}

.send-select-wrapper {
  display: flex;
  align-items: center;
  justify-contents: center;
  flex-direction: column;
  gap: 13px;
}
</style>
