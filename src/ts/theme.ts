import { I18n, I18nStringKey } from './i18n';
import fa from './fontawesome.js';

export class ThemeMgr {
	private isDarkTheme: boolean;
	private toggleThemeBtn: HTMLAnchorElement;
	private toggleThemeIcon: HTMLSpanElement;
	private toggleThemeBtnText: HTMLSpanElement;
	private i18n: I18n;

	constructor(i18n: I18n) {
		this.isDarkTheme = true;
		this.toggleThemeBtn = document.getElementById('toggleThemeBtn') as HTMLAnchorElement;
		this.toggleThemeIcon = document.getElementById('toggleThemeIcon') as HTMLSpanElement;
		this.toggleThemeBtnText = document.getElementById('toggleThemeBtnText') as HTMLSpanElement;
		this.i18n = i18n;
	}

	init() {
		this.toggleThemeBtn.addEventListener('click', (e) => {
			e.preventDefault();
			this.loadColorTheme(!this.isDarkTheme);
			localStorage.setItem('cvm-dark-theme', this.isDarkTheme ? '1' : '0');
			return false;
		});

		this.i18n.on('languageChanged', () => {
			if (this.isDarkTheme) {
				this.toggleThemeBtnText.innerHTML = this.i18n.GetString(I18nStringKey.kSiteButtons_LightMode);
			} else {
				this.toggleThemeBtnText.innerHTML = this.i18n.GetString(I18nStringKey.kSiteButtons_DarkMode);
			}
		});

		if (localStorage.getItem('cvm-dark-theme') !== null) {
			// If a theme is saved, use that
			this.loadColorTheme(localStorage.getItem('cvm-dark-theme') === '1');
		} else {
			// Use system theme
			this.loadColorTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
		}
	}

	loadColorTheme(dark: boolean) {
		if (dark) {
			this.isDarkTheme = true;
			document.children[0].setAttribute('data-bs-theme', 'dark');
			this.toggleThemeBtnText.innerHTML = this.i18n.GetString(I18nStringKey.kSiteButtons_LightMode);
			this.toggleThemeIcon.replaceChildren(...fa.icon({ prefix: 'fas', iconName: 'sun' }).node);
		} else {
			this.isDarkTheme = false;
			document.children[0].setAttribute('data-bs-theme', 'light');
			this.toggleThemeBtnText.innerHTML = this.i18n.GetString(I18nStringKey.kSiteButtons_DarkMode);
			this.toggleThemeIcon.replaceChildren(...fa.icon({ prefix: 'fas', iconName: 'moon' }).node);
		}
	}
}
