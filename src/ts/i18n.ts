import { StringLike } from './StringLike';

// Nice little string key helper
export enum I18nStringKey {
	kSiteName = 'kSiteName',
	kHomeButton = 'kHomeButton',
	kFAQButton = 'kFAQButton',
	kRulesButton = 'kRulesButton',
	kVMResetTitle = 'kVMResetTitle',
	kGenericYes = 'kGenericYes',
	kGenericNo = 'kGenericNo',
	kVMVoteTime = 'kVMVoteTime',
	kPassVoteButton = 'kPassVoteButton',
	kCancelVoteButton = 'kCancelVoteButton',
	kTakeTurnButton = 'kTakeTurnButton',
	kEndTurnButton = 'kEndTurnButton',
	kChangeUsernameButton = 'kChangeUsernameButton',
	kVoteButton = 'kVoteButton',
	kScreenshotButton = 'kScreenshotButton',
	kUsersOnlineHeading = 'kUsersOnlineHeading',
	kTurnTime = 'kTurnTime',
	kWaitingTurnTime = 'kWaitingTurnTime',
	kVoteCooldown = 'kVoteCooldown',
	kEnterNewUsername = 'kEnterNewUsername'
}

// This models the JSON structure.
export type Language = {
	languageName: string;
	translatedLanguageName: string;
	author: string;

	stringKeys: {
		// This is fancy typescript speak for
		// "any string index returns a string",
		// which is our expectation.
		// See https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures if this is confusing.
		[key: string]: string;
	};
};

// ID for fallback language
const fallbackId = 'fallback';

// This language is provided in the webapp itself just in case language stuff fails
const fallbackLanguage: Language = {
	languageName: 'Fallback',
	translatedLanguageName: 'Fallback',
	author: 'Computernewb',

	stringKeys: {
		kTitle: 'CollabVM',
		kHomeButton: 'Home',
		kFAQButton: 'FAQ',
		kRulesButton: 'Rules',
		kVMResetTitle: 'Do you want to reset the VM?',
		kGenericYes: 'Yes',
		kGenericNo: 'No',
		kVMVoteTime: 'Vote ends in {0} seconds',
		kPassVoteButton: 'Pass Vote',
		kCancelVoteButton: 'Cancel Vote',
		kTakeTurnButton: 'Take Turn',
		kEndTurnButton: 'End Turn',
		kChangeUsernameButton: 'Change Username',
		kVoteButton: 'Vote For Reset',
		kScreenshotButton: 'Screenshot',
		kUsersOnlineHeading: 'Users Online:',
		kTurnTime: 'Turn expires in {0} seconds.',
		kWaitingTurnTime: 'Waiting for turn in {0} seconds.',
		kVoteCooldown: 'Please wait {0} seconds before starting another vote.',
		kEnterNewUsername: 'Enter a new username, or leave the field blank to be assigned a guest username'
	}
};

interface StringMap {
	[k: string]: string;
}

/// our fancy internationalization helper.
export class I18n {
	// The language data itself
	private lang: Language = fallbackLanguage;

	// the ID of the language
	private langId: string = fallbackId;

	async LoadLanguageFile(id: string) {
		let languageData = await I18n.LoadLanguageFileImpl(id);
		this.SetLanguage(languageData, id);
	}

	async initWithLanguage(id: string) {
		try {
			await this.LoadLanguageFile(id);
            console.log("i18n initalized for", id, "sucessfully!");
		} catch (e) {
			alert(`There was an error loading the language file for \"${id}\". Please tell a site admin this happened, and give them the following information: \"${(e as Error).message}\"`);
			// force set the language to fallback
			this.SetLanguage(fallbackLanguage, fallbackId);
		}
	}

	private static async LoadLanguageFileImpl(id: string): Promise<Language> {
		let path = `./lang/${id}.json`;
		let res = await fetch(path);

		if (!res.ok) throw new Error(res.statusText);

		return (await res.json()) as Language;
	}

	private SetLanguage(lang: Language, id: string) {
		let lastId = this.langId;
		this.langId = id;
		this.lang = lang;

		// Only replace static strings
		if (this.langId != lastId) this.ReplaceStaticStrings();
	}

	// Replaces static strings that we don't recompute
	private ReplaceStaticStrings() {
		const kDomIdtoStringMap: StringMap = {
			siteNameText: I18nStringKey.kSiteName,
			homeBtnText: I18nStringKey.kHomeButton,
			faqBtnText: I18nStringKey.kFAQButton,
			rulesBtnText: I18nStringKey.kRulesButton,

			usersOnlineText: I18nStringKey.kUsersOnlineHeading,

			voteResetHeaderText: I18nStringKey.kVMResetTitle,
			voteYesBtnText: I18nStringKey.kGenericYes,
			voteNoBtnText: I18nStringKey.kGenericNo,

			changeUsernameBtnText: I18nStringKey.kChangeUsernameButton,
			voteForResetBtnText: I18nStringKey.kVoteButton,
			screenshotBtnText: I18nStringKey.kScreenshotButton,

			// admin stuff
			passVoteBtnText: I18nStringKey.kPassVoteButton,
			cancelVoteBtnText: I18nStringKey.kCancelVoteButton
		};

		for (let domId of Object.keys(kDomIdtoStringMap)) {
			let element = document.getElementById(domId);
			if (element == null) {
				alert('Uhh!! THIS SHOULD NOT BE SEEN!! IF YOU DO YELL LOUDLY');
				return;
			}

			// Do the magic.
			element.innerText = this.GetString(kDomIdtoStringMap[domId]);
		}
	}

	// Gets a string, which also allows replacing by index with the given replacements.
	GetString(key: string, ...replacements: StringLike[]): string {
		let replacementStringArray: Array<string> = [...replacements].map((el) => {
			// This catches cases where the thing already is a string
			if (typeof el == 'string') return el as string;
			return el.toString();
		});

		let val = this.lang.stringKeys[key];

		if (val == null) {
			let fallback = fallbackLanguage.stringKeys[key];
			if (fallback == null) return 'UH OH WORM';
			else return fallback;
		}

		for (let i = 0; i < val.length; ++i) {
			if (val[i] == '{') {
				let replacementStart = i;
				let foundReplacementEnd = false;

				if (i + 1 > val.length) {
					throw new Error('Cutoff/invalid replacement');
				}

				// Try and find the replacement end
				for (let j = i + 1; j < val.length; ++j) {
					if (val[j] == '}') {
						foundReplacementEnd = true;
						i = j;
						break;
					}
				}

				if (!foundReplacementEnd) throw new Error('Invalid replacement, has no "}" to terminate it');

				// Get the beginning and trailer
				let beginning = val.substring(0, replacementStart);
				let trailer = val.substring(replacementStart + 3);

				let replacementIndex = parseInt(val.substring(replacementStart + 1, i));
				if (Number.isNaN(replacementIndex) || replacementIndex > replacementStringArray.length) throw new Error('Invalid replacement');

				// This is seriously the only decent way to do this in javascript
				// thanks brendan eich (replace this thanking with more choice words in your head)
				val = beginning + replacementStringArray[replacementIndex] + trailer;
			}
		}

		return val;
	}
}

export let TheI18n = new I18n();