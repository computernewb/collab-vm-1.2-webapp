import { StringLike } from './StringLike';
import { Format } from './format';
import { Emitter, Unsubscribe, createNanoEvents } from 'nanoevents';
import Config from '../../config.json';

/// All string keys.
export type I18nStringKey =
	// Generic things
	'kGeneric_CollabVM' |
	'kGeneric_Yes' |
	'kGeneric_No' |
	'kGeneric_Ok' |
	'kGeneric_Cancel' |
	'kGeneric_Send' |
	'kGeneric_Understood' |
	'kGeneric_Username' |
	'kGeneric_Password' |
	'kGeneric_Login' |
	'kGeneric_Register' |
	'kGeneric_EMail' |
	'kGeneric_DateOfBirth' |
	'kGeneric_VerificationCode' |
	'kGeneric_Verify' |
	'kGeneric_Update' |
	'kGeneric_Logout' |

	'kWelcomeModal_Header' |
	'kWelcomeModal_Body' |

	'kSiteButtons_Home' |
	'kSiteButtons_FAQ' |
	'kSiteButtons_Rules' |
	'kSiteButtons_DarkMode' |
	'kSiteButtons_LightMode' |
	'kSiteButtons_Languages' |

	'kVM_UsersOnlineText' |

	'kVM_TurnTimeTimer' |
	'kVM_WaitingTurnTimer' |
	'kVM_VoteCooldownTimer' |

	'kVM_VoteForResetTitle' |
	'kVM_VoteForResetTimer' |

	'kVMButtons_TakeTurn' |
	'kVMButtons_EndTurn' |
	'kVMButtons_ChangeUsername' |
	'kVMButtons_Keyboard' |
	'KVMButtons_CtrlAltDel' |

	'kVMButtons_VoteForReset' |
	'kVMButtons_Screenshot' |

	// Admin VM buttons
	'kQEMUMonitor' |
	'kAdminVMButtons_PassVote' |
	'kAdminVMButtons_CancelVote' |

	'kAdminVMButtons_Restore' |
	'kAdminVMButtons_Reboot' |
	'kAdminVMButtons_ClearTurnQueue' |
	'kAdminVMButtons_BypassTurn' |
	'kAdminVMButtons_IndefiniteTurn' |
	'kAdminVMButtons_GhostTurnOn' |
	'kAdminVMButtons_GhostTurnOff' |

	'kAdminVMButtons_Ban' |
	'kAdminVMButtons_Kick' |
	'kAdminVMButtons_TempMute' |
	'kAdminVMButtons_IndefMute' |
	'kAdminVMButtons_Unmute' |
	'kAdminVMButtons_GetIP' |

	// prompts
	'kVMPrompts_AdminChangeUsernamePrompt' |
	'kVMPrompts_AdminRestoreVMPrompt' |
	'kVMPrompts_EnterNewUsernamePrompt' |

	// error messages
	'kError_UnexpectedDisconnection' |

	'kError_UsernameTaken' |
	'kError_UsernameInvalid' |
	'kError_UsernameBlacklisted' |
	'kError_IncorrectPassword' |

	// Auth
	'kAccountModal_Verify' |
	'kAccountModal_AccountSettings' |
	'kAccountModal_ResetPassword' |

	'kAccountModal_NewPassword' |
	'kAccountModal_ConfirmNewPassword' |
	'kAccountModal_CurrentPassword' |
	'kAccountModal_ConfirmPassword' |
	'kAccountModal_HideFlag' |

	'kAccountModal_VerifyText' |
	'kAccountModal_VerifyPasswordResetText' |
	'kAccountModal_PasswordResetSuccess' |
	'kMissingCaptcha' |
	'kPasswordsMustMatch' |

	'kNotLoggedIn';

export interface I18nEvents {
	// Called when the language is changed
	languageChanged: (lang: string) => void;
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

export type LanguageMetadata = {
	languageName: string;
	flag: string; // country flag, can be blank if not applicable. will be displayed in language dropdown
};

// `languages.json`
export type LanguagesJson = {
	// Array of language IDs to allow loading
	languages: {[key: string]: LanguageMetadata};

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
	langs : Map<string, LanguageMetadata> = new Map<string, Language>();
	lang: Language = fallbackLanguage;
	private emitter: Emitter<I18nEvents> = createNanoEvents();

	CurrentLanguage = () => this.langId;

	// the ID of the language
	private langId: string = fallbackId;

	private regionNameRenderer = new Intl.DisplayNames(['en-US'], {type: 'region'});
	
	async Init() {
		// Load language list
		var res = await fetch("lang/languages.json");
		if (!res.ok) {
			alert("Failed to load languages.json: " + res.statusText);
			await this.SetLanguage(fallbackId);
			return;
		}
		var langData = await res.json() as LanguagesJson;
		for (const langId in langData.languages) {
			this.langs.set(langId, langData.languages[langId]);
		}

		let lang = null;
		let lsLang = window.localStorage.getItem('i18n-lang');
		var browserLang = navigator.language.toLowerCase();
		// If the language is set in localstorage, use that
		if (lsLang !== null && this.langs.has(lsLang)) lang = lsLang;
		// If the browser language is in the list, use that
		else if (this.langs.has(browserLang)) lang = browserLang;
		else {
			// If the exact browser language isn't in the list, try to find a language with the same prefix
			for (let langId in langData.languages) {
				if (langId.split('-')[0] === browserLang.split('-')[0]) {
					lang = langId;
					break;
				}
			}
		}
		// If all else fails, use the default language
		if (lang === null) lang = langData.defaultLanguage;
		await this.SetLanguage(lang);
	}

	getCountryName(code: string) : string {
		return this.regionNameRenderer.of(code) || code;
	}

	async SetLanguage(id: string) {
		let lastId = this.langId;
		this.langId = id;

		let lang;
		if (id === fallbackId) lang = fallbackLanguage;
		else {
			let path = `./lang/${id}.json`;
			let res = await fetch(path);
			if (!res.ok) {
				console.error(`Failed to load lang/${id}.json: ${res.statusText}`);
				await this.SetLanguage(fallbackId);
				return;
			}
			lang = await res.json() as Language;
		}

		this.lang = lang;

		if (this.langId != lastId) {
			// Update region name renderer target language
			this.regionNameRenderer = new Intl.DisplayNames([this.langId], {type: 'region'});
		};

		// Set the language ID localstorage entry
		if (this.langId !== fallbackId) {
			window.localStorage.setItem('i18n-lang', this.langId);
		}

		this.emitter.emit('languageChanged', this.langId);
		console.log('i18n initalized for', id, 'sucessfully!');
	}

	// Returns a (raw, unformatted) string. Currently only used if we don't need formatting.
	GetStringRaw(key: I18nStringKey): string {
		if (key === 'kGeneric_CollabVM' && Config.SiteNameOverride) return Config.SiteNameOverride;
		if (key === 'kWelcomeModal_Header' && Config.WelcomeModalTitleOverride) return Config.WelcomeModalTitleOverride;
		if (key === 'kWelcomeModal_Body' && Config.WelcomeModalBodyOverride) return Config.WelcomeModalBodyOverride;
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

	on<e extends keyof I18nEvents>(event: e, cb: I18nEvents[e]): Unsubscribe {
		return this.emitter.on(event, cb);
	}
}