<script setup lang="ts">
import axios from 'axios';
import { ref, defineEmits, defineProps, onMounted, watch } from 'vue';
import type { Ref } from 'vue';
import Listbox, { type ListboxChangeEvent } from 'primevue/listbox';
import InputText from 'primevue/inputtext';

const props = defineProps<{ isStreamingActive: boolean }>();
const emit = defineEmits<{ (e: 'convo-selected', convoIdOrNull: number | null): void }>();

const isStreamingActive: Ref<boolean> = ref(false);
const selectedConversation: Ref<Conversation | null> = ref(null);
const newConversationName: Ref<string> = ref("");
const conversations: Ref<Conversation[]> = ref([]);

// Watchers
watch(
  () => props.isStreamingActive,
  (newIsStreamingActive) => {
    isStreamingActive.value = newIsStreamingActive;
  }
);

// Methods
const handleSelectionChange = (event: ListboxChangeEvent) => {
  const selectedConvo = event.value as Conversation;
  emit('convo-selected', selectedConvo ? selectedConvo.id : null);
};

const loadConversations = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/conversations');
    if (response.status === 200) {
      conversations.value = response.data;
    } else {
      console.error("Load convo request failed: ", response.status);
    }
  } catch (err) {
    // TODO prompt user with error
    console.error("Failed loading conversations: ", err);
  }
};

const createConversation = async () => {
  try {
    const response = await axios.post('http://localhost:3001/api/conversations', {
      name: newConversationName.value
    });
    if (response.status === 201) {
      conversations.value.push(response.data);
    }
  } catch (err) {
    // TODO prompt user with error
    console.error("Error creating conversation: ", err);
  } finally {
    newConversationName.value = "";
  }
};

// Lifecycle Hooks
onMounted(loadConversations);

</script>

<template>
  <div class="model-convo-display">
    <div class="name-definer">
      <InputText v-model="newConversationName" class="convo-input" placeholder="Enter new conversation name..." />
      <button @click="createConversation" class="add-button"><i class="pi pi-plus"></i></button>
    </div>
    <Listbox v-model="selectedConversation" :options="conversations" optionLabel="name" :disabled="isStreamingActive"
      class="model-convo-list" @change="handleSelectionChange" />
  </div>
</template>

<style scoped>
.name-definer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.convo-input {
  flex-grow: 1;
  min-width: 0;
  margin-right: 2px;
}

.add-button {
  flex-shrink: 0;
  min-width: 50px;
  min-height: 50px;
}

.model-convo-display {
  display: flex;
  flex-direction: column;
  width: 100%;
}

::v-deep .model-convo-list .p-listbox-item {
  max-height: 65px;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
}
</style>
