<template>
    <bsmodal 
        :title="title"
        :modal-class="['modal-lg', 'fade']"
        :header-has-dismiss="false"
        :footer-buttons="[
            {
                text: TheI18n.GetString('kGeneric_Understood'),
                class: ['btn', 'btn-primary'],
                dismissesModal: true,
                isEnabled: canDismiss,
                onclick: () => $emit('understood')
            }
        ]"
        ref="modal">
            <div v-html="body"></div>
        </bsmodal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import bsmodal from './bsmodal.vue';
import { I18n } from '../ts/i18n';
import Config from '../../config.json';

export default defineComponent({
    data() {
        return {
            canDismiss: false,
            title: '',
            body: '',
        }
    },
    components: {
        bsmodal
    },
    inject: ["i18n"],
    computed: {
        TheI18n() {
            return (this.i18n as I18n);
        },
        modal() {
            return (this.$refs.modal as typeof bsmodal.methods)!;
        }
    },
    methods: {
        show() {
            this.canDismiss = false;
            this.modal.show();
            setInterval(() => {
                this.canDismiss = true;
            }, 5000);
        },
        hide() {
            this.modal.hide();
        }
    },
    mounted() {
        this.title = Config.WelcomeModalTitleOverride ?? this.TheI18n.GetString('kWelcomeModal_Header');
        this.body = Config.WelcomeModalBodyOverride ?? this.TheI18n.GetString('kWelcomeModal_Body')
    },
    emits: ['understood']
});
</script>