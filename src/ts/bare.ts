// Entry point for the rules page (and any other static pages we add). Only loads I18n and theming
import { TheI18n } from './i18n';
import { ThemeMgr } from './theme.js';
import * as bootstrap from 'bootstrap';
// forces parcel to include bootstrap so the dropdown works
bootstrap;

// dumb hack
TheI18n.baseUrl = new URL('../lang', window.location.href).href;

let theme = new ThemeMgr(TheI18n);

document.addEventListener('DOMContentLoaded', async () => {
	// Initalize the i18n system
	await TheI18n.Init();
	// Load theme
	theme.init();
});
