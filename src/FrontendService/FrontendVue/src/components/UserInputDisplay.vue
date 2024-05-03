<script setup lang="ts">
import { ref } from 'vue'; 
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

const message = ref('');
const isStreaming = ref(false);

function sendMessage() {
  // Implement message sending logic
  isStreaming.value = true; 
  message.value = '';
}

function cancelStreaming() {
  // Implement streaming cancellation logic
  isStreaming.value = false; 
}

</script>
<template>
  <div class="user-input-display">
    <Textarea class="text-area"
              v-model="message"
              placeholder="Type here..."
              />
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
  resize:none;
}

</style>
