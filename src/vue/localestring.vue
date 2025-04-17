<template>
    <span v-text="langstr"></span>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { I18n, I18nStringKey } from '../ts/i18n';
import { StringLike } from '../ts/StringLike';

export default defineComponent({
    props: {
        strkey: {
            type: String as PropType<I18nStringKey>,
            required: true
        },
        params: {
            type: Array<StringLike>,
            default: []
        }
    },
    data() {
        return {
            langstr: ""
        }
    },
    methods: {
        loadString() {
            this.langstr = this.TheI18n.GetString(this.strkey, this.params);
        }
    },
    computed: {
        TheI18n() {
            return (this.i18n as I18n);
        },
    },
    mounted() {
        this.TheI18n.on('languageChanged', () => this.loadString());
        this.loadString();
    },
    inject: ['i18n'],
})
</script>