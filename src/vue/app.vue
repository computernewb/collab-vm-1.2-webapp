<template>
    <navbar site-name="CollabVM" :theme-manager="themeManager" />
    <div class="container-fluid">
        <vmlist v-if="activeVM === null" :server-addresses="Config.ServerAddresses" @vm="openVM" />
        <vmview v-else :vm="getVM()" />
    </div>
</template>

<script lang="ts">
import vmlist from './vmlist/vmlist.vue';
import vmview from './vmview/vmview.vue';
import navbar from './navbar.vue';
import Config from "../../config.json";
import CollabVMClient from '../ts/protocol/CollabVMClient';
import VM from '../ts/protocol/VM';
import { reactive } from 'vue';
import { ThemeManager } from '../ts/ThemeManager';

export default {
    data() {
        return {
            Config,
            activeVM: null as (CollabVMClient | null),
            themeManager: new ThemeManager()
        }
    },
    mounted() {
        let self = this;
        // Exposed collabvm api
        (window as any).collabvm = {
            getVM() {
                return self.activeVM
            }
        }
    },
    components: {
        vmlist,
        vmview,
        navbar
    },
    methods: {
        async openVM(vm: VM) {
            let client = new CollabVMClient(vm.url);

            // Hook Vue into the userlist
            client.users = reactive(client.users);

            await client.WaitForOpen();
            await client.connect(vm.id);
            this.activeVM = client;
        },
        getVM() {
            return this.activeVM as CollabVMClient;
        }
    }
}
</script>