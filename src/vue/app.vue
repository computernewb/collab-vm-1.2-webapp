<template>
    <navbar site-name="CollabVM" :theme-manager="themeManager" />
    <div class="container-fluid">
        <vmlist v-if="activeVM === null" :server-addresses="Config.ServerAddresses" :vms="vms" @list-updated="handleHashChange" />
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
import { I18n } from '../ts/i18n';

export default {
    data() {
        return {
            Config,
            activeVM: null as (CollabVMClient | null),
            themeManager: new ThemeManager(),
            vms: [] as VM[],
            _i18n: new I18n()
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
        // Register hash handler
        window.addEventListener("hashchange", () => this.handleHashChange());
        // Init i18n
        this.TheI18n.Init();
    },
    provide() {
        return {
            i18n: this.TheI18n
        }
    },
    components: {
        vmlist,
        vmview,
        navbar
    },
    computed: {
        TheI18n() {
            return this._i18n;
        }
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
        },
        handleHashChange() {
            let hash = window.location.hash.substring(1);
            if (!hash) {
                this.activeVM = null;
                return;
            }
            // Check if VM exists
            let vm = this.vms.find(v => v.id === hash);
            if (!vm) {
                this.activeVM = null;
                return;
            }

            // Open VM
            this.openVM(vm);
        }
    }
}
</script>