<template>
    <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="javascript:void(0)" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            <FontAwesomeIcon :icon="['fa-solid', 'fa-globe']"/> <localestring :strkey="'kSiteButtons_Languages'"/>
        </a>
        <div class="dropdown-menu dropdown-menu-end">
            <a v-for="[langId, lang] in TheI18n.langs" class="dropdown-item" href="javascript:void(0)" @click="() => TheI18n.SetLanguage(langId)">
                <span class="language-flag" v-html="twemoji.parse(lang.flag)"></span> {{ lang.languageName }}
            </a>
        </div>
    </li>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { I18n } from '../ts/i18n';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import localestring from './localestring.vue';
import twemoji from '@twemoji/api';

export default defineComponent({
    data() {
        return {
            twemoji
        }
    },
    computed: {
        TheI18n() {
            return this.i18n as I18n;
        }
    },
    components: {
        FontAwesomeIcon,
        localestring
    },
    inject: ["i18n"],
})
</script>