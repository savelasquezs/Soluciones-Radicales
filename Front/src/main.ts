import { createApp } from 'vue';
import App from './app/App.vue';
import { router } from './app/router';
import { pinia } from './app/providers/pinia';
import './assets/styles/index.css';
import '@vuepic/vue-datepicker/dist/main.css';

createApp(App).use(pinia).use(router).mount('#app');
