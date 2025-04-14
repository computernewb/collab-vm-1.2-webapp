<template>
    <div class="card vm-card" :data-cvm-node="vm.id">
        <img class="card-img-top" v-bind:src="vm.thumbnailSrc" />
        <div class="card-body">
            <h5 v-html="vm.displayName"></h5>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import VM from '../../ts/protocol/VM';

export default defineComponent({
    props: {
        vm: {
            type: Object as PropType<VM>,
            required: true
        }
    },
})
</script>