<template>
    <div class="table-responsive chat-table" ref="chatHistoryRoot">
        <table class="table table-hover table-borderless">
            <tbody>
                <tr v-for="message in chatMessages" class="chat-message">
                    <td v-if="message.username.length > 0">
                        <b class="chat-message-username">{{ message.username }}</b>
                        <span class="chat-message-body" v-html="message.message"></span>
                    </td>
                    <td v-else v-html="message.message"></td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="input-group">
        <span class="input-group-text vm-username">{{ username }}</span>
        <input type="text" class="form-control chat-input" v-model="chatInput" @keypress="(p) => (p.key === 'Enter') && sendChat()"/>
        <button class="btn btn-primary" type="button" @click="sendChat()" >Send</button>
    </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';

export default defineComponent({
    props: {
        username: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            chatMessages: [] as Array<{username: string, message: string}>,
            chatInput: ""
        }
    },
    methods: {
        chatMessage(username: string, message: string) {
            const chatHistoryRoot = this.$refs.chatHistoryRoot as HTMLDivElement;
            let doScroll = Math.ceil(chatHistoryRoot.scrollTop + chatHistoryRoot.clientHeight) === chatHistoryRoot.scrollHeight;
            this.chatMessages.push({username, message});
            // Wait for the list to re-render and scroll if needed
            nextTick(() => {
                if (doScroll) {
                    chatHistoryRoot.scrollTop = chatHistoryRoot.scrollHeight;
                }
            });
        },
        sendChat() {
            this.$emit("chat", this.chatInput);
            this.chatInput = "";
        }
    },
    emits: ["chat"]
})
</script>