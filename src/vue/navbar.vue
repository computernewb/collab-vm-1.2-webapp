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
                        <a :href="link.href" @click="link.onclick?.()" class="nav-link"><FontAwesomeIcon :icon="link.icon"/> <span v-html="link.text"></span></a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ThemeManager } from '../ts/ThemeManager';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface NavbarLink {
    text: string;
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
                { text: 'Home', href: '#', icon: ['fa-solid', 'fa-house'] },
                { text: 'FAQ', href: 'https://computernewb.com/collab-vm/faq/', icon: ['fa-solid', 'fa-circle-question'] },
                { text: 'Rules', href: 'https://computernewb.com/collab-vm/rules/', icon: ['fa-solid', 'fa-clipboard-check'] },
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
            return this.themeManager.isDarkTheme ? "Light Theme" : "Dark Theme";
        },
        themeToggleIcon() {
            return this.themeManager.isDarkTheme ? "fa-sun" : "fa-moon";
        }
    },
    components: {
        FontAwesomeIcon
    }
});
</script>