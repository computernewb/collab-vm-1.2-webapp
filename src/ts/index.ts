import { createApp } from "vue";
import App from "../vue/app.vue";
import { fontAwesomeLibrary } from "./icons";
import * as bootstrap from 'bootstrap';

// init fontawesome
fontAwesomeLibrary();

// force parcel to bundle bootstrap
bootstrap;

const app = createApp(App);
app.mount("#app");