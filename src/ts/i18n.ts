import { StringLike } from './StringLike';
import { Format } from './format';

/// All string keys.
export enum I18nStringKey {
	// Generic things
	kGeneric_CollabVM = 'kGeneric_CollabVM',
	kGeneric_Yes = 'kGeneric_Yes',
	kGeneric_No = 'kGeneric_No',
	kGeneric_Ok = 'kGeneric_Ok',
	kGeneric_Cancel = 'kGeneric_Cancel',
	kGeneric_Send = 'kGeneric_Send',
	kGeneric_Understood = 'kGeneric_Understood',
	kGeneric_Username = 'kGeneric_Username',
	kGeneric_Password = 'kGeneric_Password',
	kGeneric_Login = 'kGeneric_Login',
	kGeneric_Register = 'kGeneric_Register',
	kGeneric_EMail = 'kGeneric_EMail',
	kGeneric_DateOfBirth = 'kGeneric_DateOfBirth',
	kGeneric_VerificationCode = 'kGeneric_VerificationCode',
	kGeneric_Verify = 'kGeneric_Verify',
	kGeneric_Update = 'kGeneric_Update',
	kGeneric_Logout = 'kGeneric_Logout',

	kWelcomeModal_Header = 'kWelcomeModal_Header',
	kWelcomeModal_Body = 'kWelcomeModal_Body',

	kSiteButtons_Home = 'kSiteButtons_Home',
	kSiteButtons_FAQ = 'kSiteButtons_FAQ',
	kSiteButtons_Rules = 'kSiteButtons_Rules',
	kSiteButtons_DarkMode = 'kSiteButtons_DarkMode',
	kSiteButtons_LightMode = 'kSiteButtons_LightMode',
	kSiteButtons_Languages = 'kSiteButtons_Languages',

	kVM_UsersOnlineText = 'kVM_UsersOnlineText',

	kVM_TurnTimeTimer = 'kVM_TurnTimeTimer',
	kVM_WaitingTurnTimer = 'kVM_WaitingTurnTimer',
	kVM_VoteCooldownTimer = 'kVM_VoteCooldownTimer',

	kVM_VoteForResetTitle = 'kVM_VoteForResetTitle',
	kVM_VoteForResetTimer = 'kVM_VoteForResetTimer',

	kVMButtons_TakeTurn = 'kVMButtons_TakeTurn',
	kVMButtons_EndTurn = 'kVMButtons_EndTurn',
	kVMButtons_ChangeUsername = 'kVMButtons_ChangeUsername',
	kVMButtons_Keyboard = 'kVMButtons_Keyboard',
	KVMButtons_CtrlAltDel = 'KVMButtons_CtrlAltDel',

	kVMButtons_VoteForReset = 'kVMButtons_VoteForReset',
	kVMButtons_Screenshot = 'kVMButtons_Screenshot',

	// Admin VM buttons
	kQEMUMonitor = 'kQEMUMonitor',
	kAdminVMButtons_PassVote = 'kAdminVMButtons_PassVote',
	kAdminVMButtons_CancelVote = 'kAdminVMButtons_CancelVote',

	kAdminVMButtons_Restore = 'kAdminVMButtons_Restore',
	kAdminVMButtons_Reboot = 'kAdminVMButtons_Reboot',
	kAdminVMButtons_ClearTurnQueue = 'kAdminVMButtons_ClearTurnQueue',
	kAdminVMButtons_BypassTurn = 'kAdminVMButtons_BypassTurn',
	kAdminVMButtons_IndefiniteTurn = 'kAdminVMButtons_IndefiniteTurn',

	kAdminVMButtons_Ban = 'kAdminVMButtons_Ban',
	kAdminVMButtons_Kick = 'kAdminVMButtons_Kick',
	kAdminVMButtons_TempMute = 'kAdminVMButtons_TempMute',
	kAdminVMButtons_IndefMute = 'kAdminVMButtons_IndefMute',
	kAdminVMButtons_Unmute = 'kAdminVMButtons_Unmute',
	kAdminVMButtons_GetIP = 'kAdminVMButtons_GetIP',

	// prompts
	kVMPrompts_AdminChangeUsernamePrompt = 'kVMPrompts_AdminChangeUsernamePrompt',
	kVMPrompts_AdminRestoreVMPrompt = 'kVMPrompts_AdminRestoreVMPrompt',
	kVMPrompts_EnterNewUsernamePrompt = 'kVMPrompts_EnterNewUsernamePrompt',

	// error messages
	kError_UnexpectedDisconnection = 'kError_UnexpectedDisconnection',

	kError_UsernameTaken = 'kError_UsernameTaken',
	kError_UsernameInvalid = 'kError_UsernameInvalid',
	kError_UsernameBlacklisted = 'kError_UsernameBlacklisted',
	kError_IncorrectPassword = 'kError_IncorrectPassword',

	// Auth
	kAccountModal_Verify = 'kAccountModal_Verify',
	kAccountModal_AccountSettings = 'kAccountModal_AccountSettings',
	kAccountModal_ResetPassword = 'kAccountModal_ResetPassword',

	kAccountModal_NewPassword = 'kAccountModal_NewPassword',
	kAccountModal_ConfirmNewPassword = 'kAccountModal_ConfirmNewPassword',
	kAccountModal_CurrentPassword = 'kAccountModal_CurrentPassword',
	kAccountModal_ConfirmPassword = 'kAccountModal_ConfirmPassword',

	kAccountModal_VerifyText = 'kAccountModal_VerifyText',
	kAccountModal_VerifyPasswordResetText = 'kAccountModal_VerifyPasswordResetText',
	kAccountModal_PasswordResetSuccess = 'kAccountModal_PasswordResetSuccess',
	kMissingCaptcha = 'kMissingCaptcha',
	kPasswordsMustMatch = 'kPasswordsMustMatch',

	kNotLoggedIn = 'kNotLoggedIn',
}

// This models the JSON structure.
export type Language = {
	languageName: string;
	translatedLanguageName: string;
	flag: string; // country flag, can be blank if not applicable. will be displayed in language dropdown
	author: string;

	stringKeys: {
		// This is fancy typescript speak for
		// "any string index returns a string",
		// which is our expectation.
		// See https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures if this is confusing.
		[key: string]: string;
	};
};

// `languages.json`
export type LanguagesJson = {
	// Array of language IDs to allow loading
	languages: Array<string>;

	// The default language (set if a invalid language not in the languages array is set, or no language is set)
	defaultLanguage: string;
};

// ID for fallback language
const fallbackId = '!!fallback';

// This language is provided in the webapp itself just in case language stuff fails
import fallbackLanguage from './fallbackLanguage.js';

interface StringKeyMap {
	[k: string]: I18nStringKey;
}

/// our fancy internationalization helper.
export class I18n {
	// The language data itself
	private langs : Map<string, Language> = new Map<string, Language>();
	private lang: Language = fallbackLanguage;
	private languageDropdown: HTMLSpanElement = document.getElementById('languageDropdown') as HTMLSpanElement;

	// the ID of the language
	private langId: string = fallbackId;
	
	async Init() {
		let lang = window.localStorage.getItem('i18n-lang');

		// Load language list
		var res = await fetch("lang/languages.json");
		if (!res.ok) {
			alert("Failed to load languages.json: " + res.statusText);
			this.SetLanguage(fallbackLanguage, fallbackId);
			this.ReplaceStaticStrings();
			return;
		}
		var langData = await res.json() as LanguagesJson;
		if (lang === null) lang = langData.defaultLanguage;
		for (const langId of langData.languages) {
			let path = `./lang/${langId}.json`;
			let res = await fetch(path);
			if (!res.ok) {
				console.error(`Failed to load lang/${langId}.json: ${res.statusText}`);
				continue;
			}
			let _lang = await res.json() as Language;
			this.langs.set(langId, _lang);
		}
		this.langs.forEach((_lang, langId) => {
			// Add to language dropdown
			var a = document.createElement('a');
			a.classList.add('dropdown-item');
			a.href = '#';
			a.innerText = `${_lang.flag} ${_lang.languageName}`;
			a.addEventListener('click', (e) => {
				e.preventDefault();
				this.SetLanguage(_lang, langId);
				this.ReplaceStaticStrings();
			});
			this.languageDropdown.appendChild(a);
		});
		if (!this.langs.has(lang)) lang = langData.defaultLanguage;
		this.SetLanguage(this.langs.get(lang) as Language, lang);
		this.ReplaceStaticStrings();
	}

	private SetLanguage(lang: Language, id: string) {
		let lastId = this.langId;
		this.langId = id;
		this.lang = lang;

		// Only replace static strings
		if (this.langId != lastId) this.ReplaceStaticStrings();

		// Set the language ID localstorage entry
		if (this.langId !== fallbackId) {
			window.localStorage.setItem('i18n-lang', this.langId);
		}
		console.log('i18n initalized for', id, 'sucessfully!');
	}

	// Replaces static strings that we don't recompute
	private ReplaceStaticStrings() {
		const kDomIdtoStringMap: StringKeyMap = {
			siteNameText: I18nStringKey.kGeneric_CollabVM,
			homeBtnText: I18nStringKey.kSiteButtons_Home,
			faqBtnText: I18nStringKey.kSiteButtons_FAQ,
			rulesBtnText: I18nStringKey.kSiteButtons_Rules,
			accountDropdownUsername: I18nStringKey.kNotLoggedIn,
			accountLoginButton: I18nStringKey.kGeneric_Login,
			accountRegisterButton: I18nStringKey.kGeneric_Register,
			accountSettingsButton: I18nStringKey.kAccountModal_AccountSettings,
			accountLogoutButton: I18nStringKey.kGeneric_Logout,
			languageDropdownText: I18nStringKey.kSiteButtons_Languages,
			
			welcomeModalHeader: I18nStringKey.kWelcomeModal_Header,
			welcomeModalBody: I18nStringKey.kWelcomeModal_Body,
			welcomeModalDismiss: I18nStringKey.kGeneric_Understood,

			usersOnlineText: I18nStringKey.kVM_UsersOnlineText,

			voteResetHeaderText: I18nStringKey.kVM_VoteForResetTitle,
			voteYesBtnText: I18nStringKey.kGeneric_Yes,
			voteNoBtnText: I18nStringKey.kGeneric_No,

			changeUsernameBtnText: I18nStringKey.kVMButtons_ChangeUsername,
			oskBtnText: I18nStringKey.kVMButtons_Keyboard,
			ctrlAltDelBtnText: I18nStringKey.KVMButtons_CtrlAltDel,
			voteForResetBtnText: I18nStringKey.kVMButtons_VoteForReset,
			screenshotBtnText: I18nStringKey.kVMButtons_Screenshot,

			// admin stuff
			badPasswordAlertText: I18nStringKey.kError_IncorrectPassword,
			loginModalPasswordText: I18nStringKey.kGeneric_Password,
			loginButton: I18nStringKey.kGeneric_Login,
			passVoteBtnText: I18nStringKey.kAdminVMButtons_PassVote,
			cancelVoteBtnText: I18nStringKey.kAdminVMButtons_CancelVote,
			endTurnBtnText: I18nStringKey.kVMButtons_EndTurn,
			qemuMonitorBtnText: I18nStringKey.kQEMUMonitor,
			qemuModalHeader: I18nStringKey.kQEMUMonitor,
			qemuMonitorSendBtn: I18nStringKey.kGeneric_Send,

			restoreBtnText: I18nStringKey.kAdminVMButtons_Restore,
			rebootBtnText: I18nStringKey.kAdminVMButtons_Reboot,
			clearQueueBtnText: I18nStringKey.kAdminVMButtons_ClearTurnQueue,
			bypassTurnBtnText: I18nStringKey.kAdminVMButtons_BypassTurn,
			indefTurnBtnText: I18nStringKey.kAdminVMButtons_IndefiniteTurn,

			// Account modal
			accountLoginUsernameLabel: I18nStringKey.kGeneric_Username,
			accountLoginPasswordLabel: I18nStringKey.kGeneric_Password,
			accountModalLoginBtn: I18nStringKey.kGeneric_Login,
			accountForgotPasswordButton: I18nStringKey.kAccountModal_ResetPassword,
			accountRegisterEmailLabel: I18nStringKey.kGeneric_EMail,
			accountRegisterUsernameLabel: I18nStringKey.kGeneric_Username,
			accountRegisterPasswordLabel: I18nStringKey.kGeneric_Password,
			accountRegisterConfirmPasswordLabel: I18nStringKey.kAccountModal_ConfirmPassword,
			accountRegisterDateOfBirthLabel: I18nStringKey.kGeneric_DateOfBirth,
			accountModalRegisterBtn: I18nStringKey.kGeneric_Register,
			accountVerifyEmailCodeLabel: I18nStringKey.kGeneric_VerificationCode,
			accountVerifyEmailPasswordLabel: I18nStringKey.kGeneric_Password,
			accountModalVerifyEmailBtn: I18nStringKey.kGeneric_Verify,
			accountSettingsEmailLabel: I18nStringKey.kGeneric_EMail,
			accountSettingsUsernameLabel: I18nStringKey.kGeneric_Username,
			accountSettingsNewPasswordLabel: I18nStringKey.kAccountModal_NewPassword,
			accountSettingsConfirmNewPasswordLabel: I18nStringKey.kAccountModal_ConfirmNewPassword,
			accountSettingsCurrentPasswordLabel: I18nStringKey.kAccountModal_CurrentPassword,
			updateAccountSettingsBtn: I18nStringKey.kGeneric_Update,
			accountResetPasswordEmailLabel: I18nStringKey.kGeneric_EMail,
			accountResetPasswordUsernameLabel: I18nStringKey.kGeneric_Username,
			accountResetPasswordBtn: I18nStringKey.kAccountModal_ResetPassword,
			accountResetPasswordCodeLabel: I18nStringKey.kGeneric_VerificationCode,
			accountResetPasswordNewPasswordLabel: I18nStringKey.kAccountModal_NewPassword,
			accountResetPasswordConfirmNewPasswordLabel: I18nStringKey.kAccountModal_ConfirmNewPassword,
			accountResetPasswordVerifyBtn: I18nStringKey.kAccountModal_ResetPassword,
		};

		const kDomAttributeToStringMap = {
			adminPassword: {
				placeholder: I18nStringKey.kGeneric_Password,
			},
			accountLoginUsername: {
				placeholder: I18nStringKey.kGeneric_Username,
			},
			accountLoginPassword: {
				placeholder: I18nStringKey.kGeneric_Password,
			},
			accountRegisterEmail: {
				placeholder: I18nStringKey.kGeneric_EMail,
			},
			accountRegisterUsername: {
				placeholder: I18nStringKey.kGeneric_Username,
			},
			accountRegisterPassword: {
				placeholder: I18nStringKey.kGeneric_Password,
			},
			accountRegisterConfirmPassword: {
				placeholder: I18nStringKey.kAccountModal_ConfirmPassword,
			},
			accountVerifyEmailCode: {
				placeholder: I18nStringKey.kGeneric_VerificationCode,
			},
			accountVerifyEmailPassword: {
				placeholder: I18nStringKey.kGeneric_Password,
			},
			accountSettingsEmail: {
				placeholder: I18nStringKey.kGeneric_EMail,
			},
			accountSettingsUsername: {
				placeholder: I18nStringKey.kGeneric_Username,
			},
			accountSettingsNewPassword: {
				placeholder: I18nStringKey.kAccountModal_NewPassword,
			},
			accountSettingsConfirmNewPassword: {
				placeholder: I18nStringKey.kAccountModal_ConfirmNewPassword,
			},
			accountSettingsCurrentPassword: {
				placeholder: I18nStringKey.kAccountModal_CurrentPassword,
			},
			accountResetPasswordEmail: {
				placeholder: I18nStringKey.kGeneric_EMail,
			},
			accountResetPasswordUsername: {
				placeholder: I18nStringKey.kGeneric_Username,
			},
			accountResetPasswordCode: {
				placeholder: I18nStringKey.kGeneric_VerificationCode,
			},
			accountResetPasswordNewPassword: {
				placeholder: I18nStringKey.kAccountModal_NewPassword,
			},
			accountResetPasswordConfirmNewPassword: {
				placeholder: I18nStringKey.kAccountModal_ConfirmNewPassword,
			},
		};

		for (let domId of Object.keys(kDomIdtoStringMap)) {
			let element = document.getElementById(domId);
			if (element == null) {
				alert(`Error: Could not find element with ID ${domId} in the DOM! Please tell a site admin this happened.`);
				return;
			}

			// Do the magic.
			// N.B: For now, we assume all strings in this map are not formatted.
			// If this assumption changes, then we should just use GetString() again
			// and maybe include arguments, but for now this is okay
			element.innerHTML = this.GetStringRaw(kDomIdtoStringMap[domId]);
		}

		for (let domId of Object.keys(kDomAttributeToStringMap)) {
			let element = document.getElementById(domId);
			if (element == null) {
				alert(`Error: Could not find element with ID ${domId} in the DOM! Please tell a site admin this happened.`);
				return;
			}

			// TODO: Figure out if we can get rid of this ts-ignore
			// @ts-ignore
			let attributes = kDomAttributeToStringMap[domId];
			for (let attr of Object.keys(attributes)) {
				element.setAttribute(attr, this.GetStringRaw(attributes[attr] as I18nStringKey));
			}
		}
	}

	// Returns a (raw, unformatted) string. Currently only used if we don't need formatting.
	GetStringRaw(key: I18nStringKey): string {
		let val = this.lang.stringKeys[key];

		// Look up the fallback language by default if the language doesn't
		// have that string key yet; if the fallback doesn't have it either,
		// then just return the string key and a bit of a notice things have gone wrong
		if (val == undefined) {
			let fallback = fallbackLanguage.stringKeys[key];
			if (fallback !== undefined) val = fallback;
			else return `${key} (ERROR LOOKING UP TRANSLATION!!!)`;
		}

		return val;
	}

	// Returns a formatted localized string.
	GetString(key: I18nStringKey, ...replacements: StringLike[]): string {
		return Format(this.GetStringRaw(key), ...replacements);
	}
}

export let TheI18n = new I18n();