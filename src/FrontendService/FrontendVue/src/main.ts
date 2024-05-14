import './assets/main.css';

import { createApp } from 'vue';
//import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import ToastService from 'primevue/toastservice'

import PrimeVue from 'primevue/config';
import 'primevue/resources/themes/luna-amber/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css'

const app = createApp(App);
app.config.errorHandler = (err, vm, info) => {
    console.error('Error: ', err);
    console.error('Component: ', vm);
    console.error('Info: ', info);
    app.config.globalProperties.$toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Something went wrong: ${err?.message}',
        life: 4000,
    });
}

app.use(ToastService);
app.use(router);
app.use(PrimeVue, { inputStyle: "filled" });
app.mount('#app');
