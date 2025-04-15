<template>
    <div ref="modalRoot" class="modal" :class="modalClass" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title" v-text="title"></h1>
                    <button v-if="headerHasDismiss" type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <slot></slot>
                </div>
                <div class="modal-footer">
                    <button v-for="btn in footerButtons" 
                        type="button"
                        :class="btn.class"
                        v-bind:data-bs-dismiss="bsDismiss(btn)"
                        v-text="btn.text"
                        :disabled="!btn.isEnabled"
                        @click="() => {if (btn.isEnabled) btn.onclick?.()}"></button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Modal } from 'bootstrap';
import { computed, defineComponent } from 'vue';

export type ModalButton = {
    text: string;
    class: string[];
    onclick?() : void;
    dismissesModal: boolean;
    isEnabled: boolean;
}

export default defineComponent({
    props: {
        title: {
            type: String,
            required: true
        },
        modalClass: {
            type: Array<string>,
            default: [],
            required: true
        },
        headerHasDismiss: {
            type: Boolean,
            default: true,
            required: true
        },
        footerButtons: {
            type: Array<ModalButton>,
            default: [],
            required: true
        }
    },
    data() {
        return {
            modal: undefined as (Modal | undefined),
            computed
        }
    },
    mounted() {
        this.modal = new Modal(this.$refs.modalRoot as Element);
    },
    unmounted() {
        this.hide()
    },
    methods: {
        show() {
            this.modal!.show();
        },
        hide() {
            this.modal!.hide();
        },
        toggle() {
            this.modal!.toggle();
        },
        bsDismiss(btn: ModalButton) {
            return btn.dismissesModal ? 'modal' : undefined
        }
    }
});
</script>