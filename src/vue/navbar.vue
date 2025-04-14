<template>
    <nav class="navbar navbar-expand-lg">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">{{ siteName }}</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li v-for="link in navbarLinks" class="nav-item">
                        <a :href="link.href" @click="link.onclick?.()" class="nav-link"><FontAwesomeIcon :icon="link.icon"/> <span v-text="link.text"></span></a>
                    </li>
                    <langdropdown/>
                </ul>
            </div>
        </div>
    </nav>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent } from 'vue';
import { ThemeManager } from '../ts/ThemeManager';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import langdropdown from './langdropdown.vue';
import { I18n } from '../ts/i18n';

interface NavbarLink {
    text: string | ComputedRef<String>;
    href: string;
    icon: string[];
    onclick?: (() => void);
}

export default defineComponent({
    props: {
        siteName: {
            type: String,
            required: true
        },
        themeManager: {
            type: ThemeManager,
            required: true
        }
    },
    computed: {
        navbarLinks(): Array<NavbarLink> {
            return [
                { text: computed(() => this.TheI18n.GetString('kSiteButtons_Home')), href: '#', icon: ['fa-solid', 'fa-house'] },
                { text: computed(() => this.TheI18n.GetString('kSiteButtons_FAQ')), href: 'https://computernewb.com/collab-vm/faq/', icon: ['fa-solid', 'fa-circle-question'] },
                { text: computed(() => this.TheI18n.GetString('kSiteButtons_Rules')), href: 'https://computernewb.com/collab-vm/rules/', icon: ['fa-solid', 'fa-clipboard-check'] },
                { text: 'Discord', href: 'https://discord.horse/invite/collabvm', icon: ['fa-brands', 'fa-discord'] },
                { text: 'Reddit', href: 'https://reddit.com/r/collabvm', icon: ['fa-brands', 'fa-reddit'] },
                { text: 'Mastodon', href: 'https://fedi.computernewb.com/@collabvm', icon: ['fa-brands', 'fa-mastodon'] },
                { text: 'UserVM', href: 'https://computernewb.com/collab-vm/user-vm/', icon: ['fa-solid', 'fa-user'] },
                {
                    text: this.themeToggleText,
                    href: "javascript:void(0)",
                    icon: ["fa-solid", this.themeToggleIcon],
                    onclick: () => this.themeManager.toggleTheme()
                }
            ];
        },
        themeToggleText() {
            return this.themeManager.isDarkTheme ? computed(() => this.TheI18n.GetString('kSiteButtons_LightMode')) : computed(() => this.TheI18n.GetString('kSiteButtons_DarkMode'));
        },
        themeToggleIcon() {
            return this.themeManager.isDarkTheme ? "fa-sun" : "fa-moon";
        },
        TheI18n() {
            return (this.i18n as I18n);
        }
    },
    components: {
        FontAwesomeIcon,
        langdropdown
    },
    inject: ["i18n"]
});
</script>