<script setup lang="ts">
import { ref, defineEmits } from 'vue';
import type { Ref } from 'vue';
import Listbox, { type ListboxChangeEvent } from 'primevue/listbox';

const emit = defineEmits<{
  (e: 'convo-selected', convoId: number): void;
  }>();

const selectedConversation: Ref<Conversation | null> = ref(null);

const conversations: Ref<Conversation[]> = ref([]);

const selectConversation = (listBoxChangeEvent: ListboxChangeEvent) => {
  emit('convo-selected', listBoxChangeEvent.value.id);
}

async function loadConversations() {
  try {
    const response = await fetch('/api/conversations');
    if (response.ok) {
      conversations.value = parseResponse(response.json);
    } else {
      // retry?
    }
  } catch {
    // retry?
  }
}



const handleConversationCRUDEvent = () => {
 // handle conversation being created or deleted or name changed
}

</script>
<template>
  <div class="model-convo-display">
    <Listbox v-model="selectedConversation" :options="conversations" optionLabel="name" class="model-convo-list" @change="selectConversation" />
  </div>
</template>
<style>
/* Your styles here */
</style>
