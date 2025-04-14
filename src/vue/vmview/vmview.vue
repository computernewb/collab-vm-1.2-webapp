<template>
    <div class="vm-display" ref="display"></div>
    <p class="vm-turn-status"></p>
    <!-- vtr -->
    <div class="vm-btns">
        <div class="vm-user-btns">

        </div>
        <div class="vm-staff-btns">

        </div>
        <div class="vm-osk-container">

        </div>
    </div>
    <div class="row container-fluid">
        <div class="col-md-4">
            <vmusertable :users="vm.users" />
        </div>
        <div class="col-md-8">
            <vmchat ref="vmchat" :username="username" @chat="(msg) => vm.chat(msg)" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, toValue } from 'vue';
import vmusertable from './vmusertable.vue';
import vmchat from './vmchat.vue';
import CollabVMClient from '../../ts/protocol/CollabVMClient';

export default defineComponent({
    props: {
        vm: {
            type: CollabVMClient,
            required: true
        }
    },
    mounted() {
        (this.$refs.display as HTMLDivElement).appendChild(this.vm.canvas);
        // Chat message handler
        this.vm.on("chat", (username, message) => (this.$refs.vmchat as typeof vmchat.methods)!.chatMessage(username, message));
    },
    components: {
        vmusertable,
        vmchat
    },
    computed: {
        username() {
            return this.vm.username ?? "";
        }
    }
});
</script>