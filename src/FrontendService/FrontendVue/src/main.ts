import './assets/main.css';

import { createApp } from 'vue';
//import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

// Import PrimeVue components and CSS
import PrimeVue from 'primevue/config'; 
import 'primevue/resources/themes/luna-amber/theme.css';  
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css'

const app = createApp(App);
//app.use(createPinia());
app.use(router);
app.use(PrimeVue, { inputStyle: "filled" }); 
app.mount('#app');
