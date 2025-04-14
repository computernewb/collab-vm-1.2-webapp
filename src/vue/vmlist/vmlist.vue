<template>
    <div class="row">
        <div class="vm-card-col col-sm-5 col-md-3" v-for="vm in vms">
            <vmlistcard :vm="vm"/>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import VM from '../../ts/protocol/VM';
import vmlistcard from './vmlistcard.vue';
import { ListNodes } from '../../ts/protocol/ListNodes';

export default defineComponent({
    props: {
        serverAddresses: {
            type: Array<string>,
            required: true
        },
        vms: {
            type: Array<VM>,
            required: true
        }
    },
    components: {
        vmlistcard
    },
    async mounted() {
        for (let url of this.serverAddresses) {
            await this.multicollab(url);
        }
    },
    methods: {
        async multicollab(url: string) {
            let vms = await ListNodes(url);
            // Remove existing VMs
            for (let [i, vm] of this.vms.entries()) {
                if (vms.some(v => v.id === vm.id)) {
                    this.vms.splice(i, 1);
                }
            }
            // Add new VMs
            this.vms.push(...vms);
            // Sort
            this.vms.sort((a, b) => a.id.localeCompare(b.id));
            // emit event
            this.$emit("listUpdated");
        }
    },
    emits: ["listUpdated"]
});
</script>