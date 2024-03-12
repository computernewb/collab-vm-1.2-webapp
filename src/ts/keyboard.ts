// Pulled a bunch of functions out of the guac source code to get a keysym
// and then a wrapper
// shitty but it works so /shrug
// THIS SUCKS SO BAD AND I HATE IT PLEASE REWRITE ALL OF THIS

export default function GetKeysym(keyCode: number, key: string, location: number): number | null {
	let keysym = keysym_from_key_identifier(key, location) || keysym_from_keycode(keyCode, location);
	return keysym;
}

function keysym_from_key_identifier(identifier: string, location: number): number | null {
	if (!identifier) return null;

	let typedCharacter: string | undefined;

	// If identifier is U+xxxx, decode Unicode character
	const unicodePrefixLocation = identifier.indexOf('U+');
	if (unicodePrefixLocation >= 0) {
		const hex = identifier.substring(unicodePrefixLocation + 2);
		typedCharacter = String.fromCharCode(parseInt(hex, 16));
	} else if (identifier.length === 1) typedCharacter = identifier;
	else return get_keysym(keyidentifier_keysym[identifier], location);

	if (!typedCharacter) return null;

	const codepoint = typedCharacter.charCodeAt(0);
	return keysym_from_charcode(codepoint);
}

function get_keysym(keysyms: number[] | null, location: number): number | null {
	if (!keysyms) return null;
	return keysyms[location] || keysyms[0];
}

function keysym_from_charcode(codepoint: number): number | null {
	if (isControlCharacter(codepoint)) return 0xff00 | codepoint;
	if (codepoint >= 0x0000 && codepoint <= 0x00ff) return codepoint;
	if (codepoint >= 0x0100 && codepoint <= 0x10ffff) return 0x01000000 | codepoint;
	return null;
}

function isControlCharacter(codepoint: number): boolean {
	return codepoint <= 0x1f || (codepoint >= 0x7f && codepoint <= 0x9f);
}

function keysym_from_keycode(keyCode: number, location: number): number | null {
	return get_keysym(keycodeKeysyms[keyCode], location);
}

function key_identifier_sane(keyCode: number, keyIdentifier: string): boolean {
	if (!keyIdentifier) return false;
	const unicodePrefixLocation = keyIdentifier.indexOf('U+');
	if (unicodePrefixLocation === -1) return true;

	const codepoint = parseInt(keyIdentifier.substring(unicodePrefixLocation + 2), 16);
	if (keyCode !== codepoint) return true;
	if ((keyCode >= 65 && keyCode <= 90) || (keyCode >= 48 && keyCode <= 57)) return true;
	return false;
}

export function OSK_buttonToKeysym(button: string): number | null {
	const keyMapping = OSK_keyMappings.find((mapping) => mapping.includes(button));
	if (keyMapping) {
		const [, keyCode, keyIdentifier, key, location] = keyMapping;
		return GetKeysym(keyCode, key, location);
	}
	return null;
}

interface KeyIdentifierKeysym {
	[key: string]: number[] | null;
}

interface KeyCodeKeysyms {
	[key: number]: number[] | null;
}

const keycodeKeysyms: KeyCodeKeysyms = {
	8: [0xff08], // backspace
	9: [0xff09], // tab
	12: [0xff0b, 0xff0b, 0xff0b, 0xffb5], // clear       / KP 5
	13: [0xff0d], // enter
	16: [0xffe1, 0xffe1, 0xffe2], // shift
	17: [0xffe3, 0xffe3, 0xffe4], // ctrl
	18: [0xffe9, 0xffe9, 0xfe03], // alt
	19: [0xff13], // pause/break
	20: [0xffe5], // caps lock
	27: [0xff1b], // escape
	32: [0x0020], // space
	33: [0xff55, 0xff55, 0xff55, 0xffb9], // page up     / KP 9
	34: [0xff56, 0xff56, 0xff56, 0xffb3], // page down   / KP 3
	35: [0xff57, 0xff57, 0xff57, 0xffb1], // end         / KP 1
	36: [0xff50, 0xff50, 0xff50, 0xffb7], // home        / KP 7
	37: [0xff51, 0xff51, 0xff51, 0xffb4], // left arrow  / KP 4
	38: [0xff52, 0xff52, 0xff52, 0xffb8], // up arrow    / KP 8
	39: [0xff53, 0xff53, 0xff53, 0xffb6], // right arrow / KP 6
	40: [0xff54, 0xff54, 0xff54, 0xffb2], // down arrow  / KP 2
	45: [0xff63, 0xff63, 0xff63, 0xffb0], // insert      / KP 0
	46: [0xffff, 0xffff, 0xffff, 0xffae], // delete      / KP decimal
	91: [0xffeb], // left window key (hyper_l)
	92: [0xff67], // right window key (menu key?)
	93: null, // select key
	96: [0xffb0], // KP 0
	97: [0xffb1], // KP 1
	98: [0xffb2], // KP 2
	99: [0xffb3], // KP 3
	100: [0xffb4], // KP 4
	101: [0xffb5], // KP 5
	102: [0xffb6], // KP 6
	103: [0xffb7], // KP 7
	104: [0xffb8], // KP 8
	105: [0xffb9], // KP 9
	106: [0xffaa], // KP multiply
	107: [0xffab], // KP add
	109: [0xffad], // KP subtract
	110: [0xffae], // KP decimal
	111: [0xffaf], // KP divide
	112: [0xffbe], // f1
	113: [0xffbf], // f2
	114: [0xffc0], // f3
	115: [0xffc1], // f4
	116: [0xffc2], // f5
	117: [0xffc3], // f6
	118: [0xffc4], // f7
	119: [0xffc5], // f8
	120: [0xffc6], // f9
	121: [0xffc7], // f10
	122: [0xffc8], // f11
	123: [0xffc9], // f12
	144: [0xff7f], // num lock
	145: [0xff14], // scroll lock
	225: [0xfe03] // altgraph (iso_level3_shift)
};

const keyidentifier_keysym: KeyIdentifierKeysym = {
	Again: [0xff66],
	AllCandidates: [0xff3d],
	Alphanumeric: [0xff30],
	Alt: [0xffe9, 0xffe9, 0xfe03],
	Attn: [0xfd0e],
	AltGraph: [0xfe03],
	ArrowDown: [0xff54],
	ArrowLeft: [0xff51],
	ArrowRight: [0xff53],
	ArrowUp: [0xff52],
	Backspace: [0xff08],
	CapsLock: [0xffe5],
	Cancel: [0xff69],
	Clear: [0xff0b],
	Convert: [0xff21],
	Copy: [0xfd15],
	Crsel: [0xfd1c],
	CrSel: [0xfd1c],
	CodeInput: [0xff37],
	Compose: [0xff20],
	Control: [0xffe3, 0xffe3, 0xffe4],
	ContextMenu: [0xff67],
	DeadGrave: [0xfe50],
	DeadAcute: [0xfe51],
	DeadCircumflex: [0xfe52],
	DeadTilde: [0xfe53],
	DeadMacron: [0xfe54],
	DeadBreve: [0xfe55],
	DeadAboveDot: [0xfe56],
	DeadUmlaut: [0xfe57],
	DeadAboveRing: [0xfe58],
	DeadDoubleacute: [0xfe59],
	DeadCaron: [0xfe5a],
	DeadCedilla: [0xfe5b],
	DeadOgonek: [0xfe5c],
	DeadIota: [0xfe5d],
	DeadVoicedSound: [0xfe5e],
	DeadSemivoicedSound: [0xfe5f],
	Delete: [0xffff],
	Down: [0xff54],
	End: [0xff57],
	Enter: [0xff0d],
	EraseEof: [0xfd06],
	Escape: [0xff1b],
	Execute: [0xff62],
	Exsel: [0xfd1d],
	ExSel: [0xfd1d],
	F1: [0xffbe],
	F2: [0xffbf],
	F3: [0xffc0],
	F4: [0xffc1],
	F5: [0xffc2],
	F6: [0xffc3],
	F7: [0xffc4],
	F8: [0xffc5],
	F9: [0xffc6],
	F10: [0xffc7],
	F11: [0xffc8],
	F12: [0xffc9],
	F13: [0xffca],
	F14: [0xffcb],
	F15: [0xffcc],
	F16: [0xffcd],
	F17: [0xffce],
	F18: [0xffcf],
	F19: [0xffd0],
	F20: [0xffd1],
	F21: [0xffd2],
	F22: [0xffd3],
	F23: [0xffd4],
	F24: [0xffd5],
	Find: [0xff68],
	GroupFirst: [0xfe0c],
	GroupLast: [0xfe0e],
	GroupNext: [0xfe08],
	GroupPrevious: [0xfe0a],
	FullWidth: null,
	HalfWidth: null,
	HangulMode: [0xff31],
	Hankaku: [0xff29],
	HanjaMode: [0xff34],
	Help: [0xff6a],
	Hiragana: [0xff25],
	HiraganaKatakana: [0xff27],
	Home: [0xff50],
	Hyper: [0xffed, 0xffed, 0xffee],
	Insert: [0xff63],
	JapaneseHiragana: [0xff25],
	JapaneseKatakana: [0xff26],
	JapaneseRomaji: [0xff24],
	JunjaMode: [0xff38],
	KanaMode: [0xff2d],
	KanjiMode: [0xff21],
	Katakana: [0xff26],
	Left: [0xff51],
	Meta: [0xffe7, 0xffe7, 0xffe8],
	ModeChange: [0xff7e],
	NumLock: [0xff7f],
	PageDown: [0xff56],
	PageUp: [0xff55],
	Pause: [0xff13],
	Play: [0xfd16],
	PreviousCandidate: [0xff3e],
	PrintScreen: [0xfd1d],
	Redo: [0xff66],
	Right: [0xff53],
	RomanCharacters: null,
	Scroll: [0xff14],
	Select: [0xff60],
	Separator: [0xffac],
	Shift: [0xffe1, 0xffe1, 0xffe2],
	SingleCandidate: [0xff3c],
	Super: [0xffeb, 0xffeb, 0xffec],
	Tab: [0xff09],
	Up: [0xff52],
	Undo: [0xff65],
	Win: [0xffeb],
	Zenkaku: [0xff28],
	ZenkakuHankaku: [0xff2a]
};

const OSK_keyMappings: [string, number, string, string, number][] = [
	['!', 49, 'Digit1', '!', 0],
	['#', 51, 'Digit3', '#', 0],
	['$', 52, 'Digit4', '$', 0],
	['%', 53, 'Digit5', '%', 0],
	['&', 55, 'Digit7', '&', 0],
	["'", 222, 'Quote', "'", 0],
	['(', 57, 'Digit9', '(', 0],
	[')', 48, 'Digit0', ')', 0],
	['*', 56, 'Digit8', '*', 0],
	['+', 187, 'Equal', '+', 0],
	[',', 188, 'Comma', ',', 0],
	['-', 189, 'Minus', '-', 0],
	['.', 190, 'Period', '.', 0],
	['/', 191, 'Slash', '/', 0],
	['0', 48, 'Digit0', '0', 0],
	['1', 49, 'Digit1', '1', 0],
	['2', 50, 'Digit2', '2', 0],
	['3', 51, 'Digit3', '3', 0],
	['4', 52, 'Digit4', '4', 0],
	['5', 53, 'Digit5', '5', 0],
	['6', 54, 'Digit6', '6', 0],
	['7', 55, 'Digit7', '7', 0],
	['8', 56, 'Digit8', '8', 0],
	['9', 57, 'Digit9', '9', 0],
	[':', 186, 'Semicolon', ':', 0],
	[';', 186, 'Semicolon', ';', 0],
	['<', 188, 'Comma', '<', 0],
	['=', 187, 'Equal', '=', 0],
	['>', 190, 'Period', '>', 0],
	['?', 191, 'Slash', '?', 0],
	['@', 50, 'Digit2', '@', 0],
	['A', 65, 'KeyA', 'A', 0],
	['B', 66, 'KeyB', 'B', 0],
	['C', 67, 'KeyC', 'C', 0],
	['D', 68, 'KeyD', 'D', 0],
	['E', 69, 'KeyE', 'E', 0],
	['F', 70, 'KeyF', 'F', 0],
	['G', 71, 'KeyG', 'G', 0],
	['H', 72, 'KeyH', 'H', 0],
	['I', 73, 'KeyI', 'I', 0],
	['J', 74, 'KeyJ', 'J', 0],
	['K', 75, 'KeyK', 'K', 0],
	['L', 76, 'KeyL', 'L', 0],
	['M', 77, 'KeyM', 'M', 0],
	['N', 78, 'KeyN', 'N', 0],
	['O', 79, 'KeyO', 'O', 0],
	['P', 80, 'KeyP', 'P', 0],
	['Q', 81, 'KeyQ', 'Q', 0],
	['R', 82, 'KeyR', 'R', 0],
	['S', 83, 'KeyS', 'S', 0],
	['T', 84, 'KeyT', 'T', 0],
	['U', 85, 'KeyU', 'U', 0],
	['V', 86, 'KeyV', 'V', 0],
	['W', 87, 'KeyW', 'W', 0],
	['X', 88, 'KeyX', 'X', 0],
	['Y', 89, 'KeyY', 'Y', 0],
	['Z', 90, 'KeyZ', 'Z', 0],
	['[', 219, 'BracketLeft', '[', 0],
	['\\', 220, 'Backslash', '\\', 0],
	[']', 221, 'BracketRight', ']', 0],
	['^', 54, 'Digit6', '^', 0],
	['_', 189, 'Minus', '_', 0],
	['`', 192, 'Backquote', '`', 0],
	['a', 65, 'KeyA', 'a', 0],
	['b', 66, 'KeyB', 'b', 0],
	['c', 67, 'KeyC', 'c', 0],
	['d', 68, 'KeyD', 'd', 0],
	['e', 69, 'KeyE', 'e', 0],
	['f', 70, 'KeyF', 'f', 0],
	['g', 71, 'KeyG', 'g', 0],
	['h', 72, 'KeyH', 'h', 0],
	['i', 73, 'KeyI', 'i', 0],
	['j', 74, 'KeyJ', 'j', 0],
	['k', 75, 'KeyK', 'k', 0],
	['l', 76, 'KeyL', 'l', 0],
	['m', 77, 'KeyM', 'm', 0],
	['n', 78, 'KeyN', 'n', 0],
	['o', 79, 'KeyO', 'o', 0],
	['p', 80, 'KeyP', 'p', 0],
	['q', 81, 'KeyQ', 'q', 0],
	['r', 82, 'KeyR', 'r', 0],
	['s', 83, 'KeyS', 's', 0],
	['t', 84, 'KeyT', 't', 0],
	['u', 85, 'KeyU', 'u', 0],
	['v', 86, 'KeyV', 'v', 0],
	['w', 87, 'KeyW', 'w', 0],
	['x', 88, 'KeyX', 'x', 0],
	['y', 89, 'KeyY', 'y', 0],
	['z', 90, 'KeyZ', 'z', 0],
	['{', 219, 'BracketLeft', '{', 0],
	['{altleft}', 18, 'AltLeft', 'AltLeft', 1],
	['{altright}', 18, 'AltRight', 'AltRight', 2],
	['{arrowdown}', 40, 'ArrowDown', 'ArrowDown', 0],
	['{arrowleft}', 37, 'ArrowLeft', 'ArrowLeft', 0],
	['{arrowright}', 39, 'ArrowRight', 'ArrowRight', 0],
	['{arrowup}', 38, 'ArrowUp', 'ArrowUp', 0],
	['{backspace}', 8, 'Backspace', 'Backspace', 0],
	['{capslock}', 20, 'CapsLock', 'CapsLock', 0],
	['{controlleft}', 17, 'ControlLeft', 'ControlLeft', 1],
	['{controlright}', 17, 'ControlRight', 'ControlRight', 2],
	['{delete}', 46, 'Delete', 'Delete', 0],
	['{end}', 35, 'End', 'End', 0],
	['{enter}', 13, 'Enter', 'Enter', 0],
	['{escape}', 27, 'Escape', 'Escape', 0],
	['{f10}', 121, 'F10', 'F10', 0],
	['{f11}', 122, 'F11', 'F11', 0],
	['{f12}', 123, 'F12', 'F12', 0],
	['{f1}', 112, 'F1', 'F1', 0],
	['{f2}', 113, 'F2', 'F2', 0],
	['{f3}', 114, 'F3', 'F3', 0],
	['{f4}', 115, 'F4', 'F4', 0],
	['{f5}', 116, 'F5', 'F5', 0],
	['{f6}', 117, 'F6', 'F6', 0],
	['{f7}', 118, 'F7', 'F7', 0],
	['{f8}', 119, 'F8', 'F8', 0],
	['{f9}', 120, 'F9', 'F9', 0],
	['{home}', 36, 'Home', 'Home', 0],
	['{insert}', 45, 'Insert', 'Insert', 0],
	['{metaleft}', 91, 'OSLeft', 'OSLeft', 1],
	['{metaright}', 92, 'OSRight', 'OSRight', 2],
	['{numlock}', 144, 'NumLock', 'NumLock', 0],
	['{numpad0}', 96, 'Numpad0', 'Numpad0', 3],
	['{numpad1}', 97, 'Numpad1', 'Numpad1', 3],
	['{numpad2}', 98, 'Numpad2', 'Numpad2', 3],
	['{numpad3}', 99, 'Numpad3', 'Numpad3', 3],
	['{numpad4}', 100, 'Numpad4', 'Numpad4', 3],
	['{numpad5}', 101, 'Numpad5', 'Numpad5', 3],
	['{numpad6}', 102, 'Numpad6', 'Numpad6', 3],
	['{numpad7}', 103, 'Numpad7', 'Numpad7', 3],
	['{numpad8}', 104, 'Numpad8', 'Numpad8', 3],
	['{numpad9}', 105, 'Numpad9', 'Numpad9', 3],
	['{numpadadd}', 107, 'NumpadAdd', 'NumpadAdd', 3],
	['{numpaddecimal}', 110, 'NumpadDecimal', 'NumpadDecimal', 3],
	['{numpaddivide}', 111, 'NumpadDivide', 'NumpadDivide', 3],
	['{numpadenter}', 13, 'NumpadEnter', 'NumpadEnter', 3],
	['{numpadmultiply}', 106, 'NumpadMultiply', 'NumpadMultiply', 3],
	['{numpadsubtract}', 109, 'NumpadSubtract', 'NumpadSubtract', 3],
	['{pagedown}', 34, 'PageDown', 'PageDown', 0],
	['{pageup}', 33, 'PageUp', 'PageUp', 0],
	['{pause}', 19, 'Pause', 'Pause', 0],
	['{prtscr}', 44, 'PrintScreen', 'PrintScreen', 0],
	['{scrolllock}', 145, 'ScrollLock', 'ScrollLock', 0],
	['{shiftleft}', 16, 'ShiftLeft', 'ShiftLeft', 1],
	['{shiftright}', 16, 'ShiftRight', 'ShiftRight', 2],
	['{space}', 32, 'Space', 'Space', 0],
	['{tab}', 9, 'Tab', 'Tab', 0],
	['|', 220, 'Backslash', '|', 0],
	['}', 221, 'BracketRight', '}', 0],
	['~', 192, 'Backquote', '~', 0],
	['"', 222, 'Quote', '"', 0]
];
