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

	kSiteButtons_Home = 'kSiteButtons_Home',
	kSiteButtons_FAQ = 'kSiteButtons_FAQ',
	kSiteButtons_Rules = 'kSiteButtons_Rules',

	kVM_UsersOnlineText = 'kVM_UsersOnlineText',

	kVM_TurnTimeTimer = 'kVM_TurnTimeTimer',
	kVM_WaitingTurnTimer = 'kVM_WaitingTurnTimer',
	kVM_VoteCooldownTimer = 'kVM_VoteCooldownTimer',

	kVM_VoteForResetTitle = 'kVM_VoteForResetTitle',
	kVM_VoteForResetTimer = 'kVM_VoteForResetTimer',

	kVMButtons_TakeTurn = 'kVMButtons_TakeTurn',
	kVMButtons_EndTurn = 'kVMButtons_EndTurn',
	kVMButtons_ChangeUsername = 'kVMButtons_ChangeUsername',

	kVMButtons_VoteForReset = 'kVMButtons_VoteForReset',
	kVMButtons_Screenshot = 'kVMButtons_Screenshot',

	// Admin VM buttons
	kAdminVMButtons_PassVote = 'kAdminVMButtons_PassVote',
	kAdminVMButtons_CancelVote = 'kAdminVMButtons_CancelVote',

	// prompts
	kVMPrompts_EnterNewUsernamePrompt = 'kVMPrompts_EnterNewUsernamePrompt',

	// error messages
	kError_UnexpectedDisconnection = 'kError_UnexpectedDisconnection',

	kError_UsernameTaken = 'kError_UsernameTaken',
	kError_UsernameInvalid = 'kError_UsernameInvalid',
	kError_UsernameBlacklisted = 'kError_UsernameBlacklisted',

	// Auth
	kAccountModal_Login = 'kAccountModal_Login',
	kAccountModal_Register = 'kAccountModal_Register',
	kAccountModal_Verify = 'kAccountModal_Verify',
	kAccountModal_AccountSettings = 'kAccountModal_AccountSettings',
	kAccountModal_ResetPassword = 'kAccountModal_ResetPassword',

	kAccountModal_VerifyText = 'kAccountModal_VerifyText',
	kAccountModal_VerifyPasswordResetText = 'kAccountModal_VerifyPasswordResetText',
	kAccountModal_PasswordResetSuccess = 'kAccountModal_PasswordResetSuccess',
	kMissingCaptcha = 'kMissingCaptcha',
	kPasswordsMustMatch = 'kPasswordsMustMatch',

	kNotLoggedIn = 'kNotLoggedIn',
}

// This models the JSON structure.
type Language = {
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
type LanguagesJson = {
	// Array of language IDs to allow loading
	languages: Array<string>;

	// The default language (set if a invalid language not in the languages array is set, or no language is set)
	defaultLanguage: string;
};

// ID for fallback language
const fallbackId = '!!fallback';

// This language is provided in the webapp itself just in case language stuff fails
const fallbackLanguage: Language = {
	languageName: 'Fallback',
	translatedLanguageName: 'Fallback',
	flag: 'no',
	author: 'Computernewb',

	stringKeys: {
		kGeneric_CollabVM: 'CollabVM',
		kGeneric_Yes: 'Yes',
		kGeneric_No: 'No',
		kGeneric_Ok: 'OK',
		kGeneric_Cancel: 'Cancel',

		kSiteButtons_Home: 'Home',
		kSiteButtons_FAQ: 'FAQ',
		kSiteButtons_Rules: 'Rules',

		kVM_UsersOnlineText: 'Users Online:',

		kVM_TurnTimeTimer: 'Turn expires in {0} seconds.',
		kVM_WaitingTurnTimer: 'Waiting for turn in {0} seconds.',
		kVM_VoteCooldownTimer: 'Please wait {0} seconds before starting another vote.',

		kVM_VoteForResetTitle: 'Do you want to reset the VM?',
		kVM_VoteForResetTimer: 'Vote ends in {0} seconds',

		kVMButtons_TakeTurn: 'Take Turn',
		kVMButtons_EndTurn: 'End Turn',
		kVMButtons_ChangeUsername: 'Change Username',

		kVMButtons_VoteForReset: 'Vote For Reset',
		kVMButtons_Screenshot: 'Screenshot',

		kAdminVMButtons_PassVoteButton: 'Pass Vote',
		kAdminVMButtons_CancelVoteButton: 'Cancel Vote',

		kVMPrompts_EnterNewUsernamePrompt: 'Enter a new username, or leave the field blank to be assigned a guest username',

		kError_UnexpectedDisconnection: 'You have been disconnected from the server.',
		kError_UsernameTaken: 'That username is already taken',
		kError_UsernameInvalid: 'Usernames can contain only numbers, letters, spaces, dashes, underscores, and dots, and it must be between 3 and 20 characters.',
		kError_UsernameBlacklisted: 'That username has been blacklisted.'
	}
};

interface StringKeyMap {
	[k: string]: I18nStringKey;
}

/// our fancy internationalization helper.
export class I18n {
	// The language data itself
	private lang: Language = fallbackLanguage;

	// the ID of the language
	private langId: string = fallbackId;

	private async LoadLanguageFile(id: string) {
		let languageData = await I18n.LoadLanguageFileImpl(id);
		this.SetLanguage(languageData, id);
	}

	async LoadAndSetLanguage(id: string) {
		try {
			await this.LoadLanguageFile(id);
			console.log('i18n initalized for', id, 'sucessfully!');
		} catch (e) {
			alert(
				`There was an error loading the language file for the language \"${id}\". Please tell a site admin this happened, and give them the following information: \"${(e as Error).message}\"`
			);
			// force set the language to fallback and replace all strings.
			// (this is done because we initialize with fallback, so SetLanguage will
			// refuse to replace static strings. Hacky but it should work)
			this.SetLanguage(fallbackLanguage, fallbackId);
			this.ReplaceStaticStrings();
		}
	}

	async Init() {
		// TODO: load languages.json, add selections, and if an invalid language (not in the languages array) is specified,
		// set it to the defaultLanguage in there.
		let lang = window.localStorage.getItem('i18n-lang');

		// Set a default language if not specified
		if (lang == null) {
			lang = 'en-us';
			window.localStorage.setItem('i18n-lang', lang);
		}

		await this.LoadAndSetLanguage(lang);
	}

	private static async LoadLanguageFileImpl(id: string): Promise<Language> {
		let path = `./lang/${id}.json`;
		let res = await fetch(path);

		if (!res.ok) {
			if (res.statusText != '') throw new Error(`Failed to load lang/${id}.json: ${res.statusText}`);
			else throw new Error(`Failed to load lang/${id}.json: HTTP status code ${res.status}`);
		}

		return (await res.json()) as Language;
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
	}

	// Replaces static strings that we don't recompute
	private ReplaceStaticStrings() {
		const kDomIdtoStringMap: StringKeyMap = {
			siteNameText: I18nStringKey.kGeneric_CollabVM,
			homeBtnText: I18nStringKey.kSiteButtons_Home,
			faqBtnText: I18nStringKey.kSiteButtons_FAQ,
			rulesBtnText: I18nStringKey.kSiteButtons_Rules,

			usersOnlineText: I18nStringKey.kVM_UsersOnlineText,

			voteResetHeaderText: I18nStringKey.kVM_VoteForResetTitle,
			voteYesBtnText: I18nStringKey.kGeneric_Yes,
			voteNoBtnText: I18nStringKey.kGeneric_No,

			changeUsernameBtnText: I18nStringKey.kVMButtons_ChangeUsername,
			voteForResetBtnText: I18nStringKey.kVMButtons_VoteForReset,
			screenshotBtnText: I18nStringKey.kVMButtons_Screenshot,

			// admin stuff
			passVoteBtnText: I18nStringKey.kAdminVMButtons_PassVote,
			cancelVoteBtnText: I18nStringKey.kAdminVMButtons_CancelVote,
			endTurnBtnText: I18nStringKey.kVMButtons_EndTurn
		};

		for (let domId of Object.keys(kDomIdtoStringMap)) {
			let element = document.getElementById(domId);
			if (element == null) {
				alert('Uhh!! THIS SHOULD NOT BE SEEN!! IF YOU DO YELL LOUDLY');
				return;
			}

			// Do the magic.
			// N.B: For now, we assume all strings in this map are not formatted.
			// If this assumption changes, then we should just use GetString() again
			// and maybe include arguments, but for now this is okay
			element.innerText = this.GetStringRaw(kDomIdtoStringMap[domId]);
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
