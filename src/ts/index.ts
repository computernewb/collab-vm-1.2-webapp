import { createApp } from "vue";
import App from "../vue/app.vue";
import { fontAwesomeLibrary } from "./icons";

// init fontawesome
fontAwesomeLibrary();

const app = createApp(App);
app.mount("#app");