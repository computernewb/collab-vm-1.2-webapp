// Pulled a bunch of functions out of the guac source code to get a keysym
// and then a wrapper
// shitty but it works so /shrug
// THIS SUCKS SO BAD AND I HATE IT PLEASE REWRITE ALL OF THIS

export default function GetKeysym(
    keyCode: number,
    keyIdentifier: string,
    key: string,
    location: number
  ): number | null {
    let keysym =
      keysym_from_key_identifier(key, location) ||
      keysym_from_keycode(keyCode, location);
  
    if (!keysym && key_identifier_sane(keyCode, keyIdentifier))
      keysym = keysym_from_key_identifier(keyIdentifier, location);
  
    return keysym;
  }
  
  function keysym_from_key_identifier(identifier: string, location: number): number | null {
    if (!identifier) return null;
  
    let typedCharacter: string | undefined;
  
    // If identifier is U+xxxx, decode Unicode character
    const unicodePrefixLocation = identifier.indexOf("U+");
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
    const unicodePrefixLocation = keyIdentifier.indexOf("U+");
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
      return GetKeysym(keyCode, keyIdentifier, key, location);
    }
    return null;
  }

interface KeyIdentifierKeysym {
    [key: string]: number[] | null;
}

interface KeyCodeKeysyms {
    [key: number]: (number[] | null);
}

var keycodeKeysyms: KeyCodeKeysyms = {
	8:   [0xFF08], // backspace
	9:   [0xFF09], // tab
	12:  [0xFF0B, 0xFF0B, 0xFF0B, 0xFFB5], // clear       / KP 5
	13:  [0xFF0D], // enter
	16:  [0xFFE1, 0xFFE1, 0xFFE2], // shift
	17:  [0xFFE3, 0xFFE3, 0xFFE4], // ctrl
	18:  [0xFFE9, 0xFFE9, 0xFE03], // alt
	19:  [0xFF13], // pause/break
	20:  [0xFFE5], // caps lock
	27:  [0xFF1B], // escape
	32:  [0x0020], // space
	33:  [0xFF55, 0xFF55, 0xFF55, 0xFFB9], // page up     / KP 9
	34:  [0xFF56, 0xFF56, 0xFF56, 0xFFB3], // page down   / KP 3
	35:  [0xFF57, 0xFF57, 0xFF57, 0xFFB1], // end         / KP 1
	36:  [0xFF50, 0xFF50, 0xFF50, 0xFFB7], // home        / KP 7
	37:  [0xFF51, 0xFF51, 0xFF51, 0xFFB4], // left arrow  / KP 4
	38:  [0xFF52, 0xFF52, 0xFF52, 0xFFB8], // up arrow    / KP 8
	39:  [0xFF53, 0xFF53, 0xFF53, 0xFFB6], // right arrow / KP 6
	40:  [0xFF54, 0xFF54, 0xFF54, 0xFFB2], // down arrow  / KP 2
	45:  [0xFF63, 0xFF63, 0xFF63, 0xFFB0], // insert      / KP 0
	46:  [0xFFFF, 0xFFFF, 0xFFFF, 0xFFAE], // delete      / KP decimal
	91:  [0xFFEB], // left window key (hyper_l)
	92:  [0xFF67], // right window key (menu key?)
	93:  null,     // select key
	96:  [0xFFB0], // KP 0
	97:  [0xFFB1], // KP 1
	98:  [0xFFB2], // KP 2
	99:  [0xFFB3], // KP 3
	100: [0xFFB4], // KP 4
	101: [0xFFB5], // KP 5
	102: [0xFFB6], // KP 6
	103: [0xFFB7], // KP 7
	104: [0xFFB8], // KP 8
	105: [0xFFB9], // KP 9
	106: [0xFFAA], // KP multiply
	107: [0xFFAB], // KP add
	109: [0xFFAD], // KP subtract
	110: [0xFFAE], // KP decimal
	111: [0xFFAF], // KP divide
	112: [0xFFBE], // f1
	113: [0xFFBF], // f2
	114: [0xFFC0], // f3
	115: [0xFFC1], // f4
	116: [0xFFC2], // f5
	117: [0xFFC3], // f6
	118: [0xFFC4], // f7
	119: [0xFFC5], // f8
	120: [0xFFC6], // f9
	121: [0xFFC7], // f10
	122: [0xFFC8], // f11
	123: [0xFFC9], // f12
	144: [0xFF7F], // num lock
	145: [0xFF14], // scroll lock
	225: [0xFE03]  // altgraph (iso_level3_shift)
};

var keyidentifier_keysym: KeyIdentifierKeysym = {
    "Again": [0xFF66],
    "AllCandidates": [0xFF3D],
    "Alphanumeric": [0xFF30],
    "Alt": [0xFFE9, 0xFFE9, 0xFE03],
    "Attn": [0xFD0E],
    "AltGraph": [0xFE03],
    "ArrowDown": [0xFF54],
    "ArrowLeft": [0xFF51],
    "ArrowRight": [0xFF53],
    "ArrowUp": [0xFF52],
    "Backspace": [0xFF08],
    "CapsLock": [0xFFE5],
    "Cancel": [0xFF69],
    "Clear": [0xFF0B],
    "Convert": [0xFF21],
    "Copy": [0xFD15],
    "Crsel": [0xFD1C],
    "CrSel": [0xFD1C],
    "CodeInput": [0xFF37],
    "Compose": [0xFF20],
    "Control": [0xFFE3, 0xFFE3, 0xFFE4],
    "ContextMenu": [0xFF67],
    "DeadGrave": [0xFE50],
    "DeadAcute": [0xFE51],
    "DeadCircumflex": [0xFE52],
    "DeadTilde": [0xFE53],
    "DeadMacron": [0xFE54],
    "DeadBreve": [0xFE55],
    "DeadAboveDot": [0xFE56],
    "DeadUmlaut": [0xFE57],
    "DeadAboveRing": [0xFE58],
    "DeadDoubleacute": [0xFE59],
    "DeadCaron": [0xFE5A],
    "DeadCedilla": [0xFE5B],
    "DeadOgonek": [0xFE5C],
    "DeadIota": [0xFE5D],
    "DeadVoicedSound": [0xFE5E],
    "DeadSemivoicedSound": [0xFE5F],
    "Delete": [0xFFFF],
    "Down": [0xFF54],
    "End": [0xFF57],
    "Enter": [0xFF0D],
    "EraseEof": [0xFD06],
    "Escape": [0xFF1B],
    "Execute": [0xFF62],
    "Exsel": [0xFD1D],
    "ExSel": [0xFD1D],
    "F1": [0xFFBE],
    "F2": [0xFFBF],
    "F3": [0xFFC0],
    "F4": [0xFFC1],
    "F5": [0xFFC2],
    "F6": [0xFFC3],
    "F7": [0xFFC4],
    "F8": [0xFFC5],
    "F9": [0xFFC6],
    "F10": [0xFFC7],
    "F11": [0xFFC8],
    "F12": [0xFFC9],
    "F13": [0xFFCA],
    "F14": [0xFFCB],
    "F15": [0xFFCC],
    "F16": [0xFFCD],
    "F17": [0xFFCE],
    "F18": [0xFFCF],
    "F19": [0xFFD0],
    "F20": [0xFFD1],
    "F21": [0xFFD2],
    "F22": [0xFFD3],
    "F23": [0xFFD4],
    "F24": [0xFFD5],
    "Find": [0xFF68],
    "GroupFirst": [0xFE0C],
    "GroupLast": [0xFE0E],
    "GroupNext": [0xFE08],
    "GroupPrevious": [0xFE0A],
    "FullWidth": null,
    "HalfWidth": null,
    "HangulMode": [0xFF31],
    "Hankaku": [0xFF29],
    "HanjaMode": [0xFF34],
    "Help": [0xFF6A],
    "Hiragana": [0xFF25],
    "HiraganaKatakana": [0xFF27],
    "Home": [0xFF50],
    "Hyper": [0xFFED, 0xFFED, 0xFFEE],
    "Insert": [0xFF63],
    "JapaneseHiragana": [0xFF25],
    "JapaneseKatakana": [0xFF26],
    "JapaneseRomaji": [0xFF24],
    "JunjaMode": [0xFF38],
    "KanaMode": [0xFF2D],
    "KanjiMode": [0xFF21],
    "Katakana": [0xFF26],
    "Left": [0xFF51],
    "Meta": [0xFFE7, 0xFFE7, 0xFFE8],
    "ModeChange": [0xFF7E],
    "NumLock": [0xFF7F],
    "PageDown": [0xFF56],
    "PageUp": [0xFF55],
    "Pause": [0xFF13],
    "Play": [0xFD16],
    "PreviousCandidate": [0xFF3E],
    "PrintScreen": [0xFD1D],
    "Redo": [0xFF66],
    "Right": [0xFF53],
    "RomanCharacters": null,
    "Scroll": [0xFF14],
    "Select": [0xFF60],
    "Separator": [0xFFAC],
    "Shift": [0xFFE1, 0xFFE1, 0xFFE2],
    "SingleCandidate": [0xFF3C],
    "Super": [0xFFEB, 0xFFEB, 0xFFEC],
    "Tab": [0xFF09],
    "Up": [0xFF52],
    "Undo": [0xFF65],
    "Win": [0xFFEB],
    "Zenkaku": [0xFF28],
    "ZenkakuHankaku": [0xFF2A]
};

const OSK_keyMappings:  [string, number, string, string, number][] = [
  ["!", 49, "Digit1", "!", 0],
  ["#", 51, "Digit3", "#", 0],
  ["$", 52, "Digit4", "$", 0],
  ["%", 53, "Digit5", "%", 0],
  ["&", 55, "Digit7", "&", 0],
  ["'", 222, "Quote", "'", 0],
  ["(", 57, "Digit9", "(", 0],
  [")", 48, "Digit0", ")", 0],
  ["*", 56, "Digit8", "*", 0],
  ["+", 187, "Equal", "+", 0],
  [",", 188, "Comma", ",", 0],
  ["-", 189, "Minus", "-", 0],
  [".", 190, "Period", ".", 0],
  ["/", 191, "Slash", "/", 0],
  ["0", 48, "Digit0", "0", 0],
  ["1", 49, "Digit1", "1", 0],
  ["2", 50, "Digit2", "2", 0],
  ["3", 51, "Digit3", "3", 0],
  ["4", 52, "Digit4", "4", 0],
  ["5", 53, "Digit5", "5", 0],
  ["6", 54, "Digit6", "6", 0],
  ["7", 55, "Digit7", "7", 0],
  ["8", 56, "Digit8", "8", 0],
  ["9", 57, "Digit9", "9", 0],
  [":", 186, "Semicolon", ":", 0],
  [";", 186, "Semicolon", ";", 0],
  ["<", 188, "Comma", "<", 0],
  ["=", 187, "Equal", "=", 0],
  [">", 190, "Period", ">", 0],
  ["?", 191, "Slash", "?", 0],
  ["@", 50, "Digit2", "@", 0],
  ["A", 65, "KeyA", "A", 0],
  ["B", 66, "KeyB", "B", 0],
  ["C", 67, "KeyC", "C", 0],
  ["D", 68, "KeyD", "D", 0],
  ["E", 69, "KeyE", "E", 0],
  ["F", 70, "KeyF", "F", 0],
  ["G", 71, "KeyG", "G", 0],
  ["H", 72, "KeyH", "H", 0],
  ["I", 73, "KeyI", "I", 0],
  ["J", 74, "KeyJ", "J", 0],
  ["K", 75, "KeyK", "K", 0],
  ["L", 76, "KeyL", "L", 0],
  ["M", 77, "KeyM", "M", 0],
  ["N", 78, "KeyN", "N", 0],
  ["O", 79, "KeyO", "O", 0],
  ["P", 80, "KeyP", "P", 0],
  ["Q", 81, "KeyQ", "Q", 0],
  ["R", 82, "KeyR", "R", 0],
  ["S", 83, "KeyS", "S", 0],
  ["T", 84, "KeyT", "T", 0],
  ["U", 85, "KeyU", "U", 0],
  ["V", 86, "KeyV", "V", 0],
  ["W", 87, "KeyW", "W", 0],
  ["X", 88, "KeyX", "X", 0],
  ["Y", 89, "KeyY", "Y", 0],
  ["Z", 90, "KeyZ", "Z", 0],
  ["[", 219, "BracketLeft", "[", 0],
  ["\\", 220, "Backslash", "\\", 0],
  ["]", 221, "BracketRight", "]", 0],
  ["^", 54, "Digit6", "^", 0],
  ["_", 189, "Minus", "_", 0],
  ["`", 192, "Backquote", "`", 0],
  ["a", 65, "KeyA", "a", 0],
  ["b", 66, "KeyB", "b", 0],
  ["c", 67, "KeyC", "c", 0],
  ["d", 68, "KeyD", "d", 0],
  ["e", 69, "KeyE", "e", 0],
  ["f", 70, "KeyF", "f", 0],
  ["g", 71, "KeyG", "g", 0],
  ["h", 72, "KeyH", "h", 0],
  ["i", 73, "KeyI", "i", 0],
  ["j", 74, "KeyJ", "j", 0],
  ["k", 75, "KeyK", "k", 0],
  ["l", 76, "KeyL", "l", 0],
  ["m", 77, "KeyM", "m", 0],
  ["n", 78, "KeyN", "n", 0],
  ["o", 79, "KeyO", "o", 0],
  ["p", 80, "KeyP", "p", 0],
  ["q", 81, "KeyQ", "q", 0],
  ["r", 82, "KeyR", "r", 0],
  ["s", 83, "KeyS", "s", 0],
  ["t", 84, "KeyT", "t", 0],
  ["u", 85, "KeyU", "u", 0],
  ["v", 86, "KeyV", "v", 0],
  ["w", 87, "KeyW", "w", 0],
  ["x", 88, "KeyX", "x", 0],
  ["y", 89, "KeyY", "y", 0],
  ["z", 90, "KeyZ", "z", 0],
  ["{", 219, "BracketLeft", "{", 0],
  ["{altleft}", 18, "AltLeft", "AltLeft", 1],
  ["{altright}", 18, "AltRight", "AltRight", 2],
  ["{arrowdown}", 40, "ArrowDown", "ArrowDown", 0],
  ["{arrowleft}", 37, "ArrowLeft", "ArrowLeft", 0],
  ["{arrowright}", 39, "ArrowRight", "ArrowRight", 0],
  ["{arrowup}", 38, "ArrowUp", "ArrowUp", 0],
  ["{backspace}", 8, "Backspace", "Backspace", 0],
  ["{capslock}", 20, "CapsLock", "CapsLock", 0],
  ["{controlleft}", 17, "ControlLeft", "ControlLeft", 1],
  ["{controlright}", 17, "ControlRight", "ControlRight", 2],
  ["{delete}", 46, "Delete", "Delete", 0],
  ["{end}", 35, "End", "End", 0],
  ["{enter}", 13, "Enter", "Enter", 0],
  ["{escape}", 27, "Escape", "Escape", 0],
  ["{f10}", 121, "F10", "F10", 0],
  ["{f11}", 122, "F11", "F11", 0],
  ["{f12}", 123, "F12", "F12", 0],
  ["{f1}", 112, "F1", "F1", 0],
  ["{f2}", 113, "F2", "F2", 0],
  ["{f3}", 114, "F3", "F3", 0],
  ["{f4}", 115, "F4", "F4", 0],
  ["{f5}", 116, "F5", "F5", 0],
  ["{f6}", 117, "F6", "F6", 0],
  ["{f7}", 118, "F7", "F7", 0],
  ["{f8}", 119, "F8", "F8", 0],
  ["{f9}", 120, "F9", "F9", 0],
  ["{home}", 36, "Home", "Home", 0],
  ["{insert}", 45, "Insert", "Insert", 0],
  ["{metaleft}", 91, "OSLeft", "OSLeft", 1],
  ["{metaright}", 92, "OSRight", "OSRight", 2],
  ["{numlock}", 144, "NumLock", "NumLock", 0],
  ["{numpad0}", 96, "Numpad0", "Numpad0", 3],
  ["{numpad1}", 97, "Numpad1", "Numpad1", 3],
  ["{numpad2}", 98, "Numpad2", "Numpad2", 3],
  ["{numpad3}", 99, "Numpad3", "Numpad3", 3],
  ["{numpad4}", 100, "Numpad4", "Numpad4", 3],
  ["{numpad5}", 101, "Numpad5", "Numpad5", 3],
  ["{numpad6}", 102, "Numpad6", "Numpad6", 3],
  ["{numpad7}", 103, "Numpad7", "Numpad7", 3],
  ["{numpad8}", 104, "Numpad8", "Numpad8", 3],
  ["{numpad9}", 105, "Numpad9", "Numpad9", 3],
  ["{numpadadd}", 107, "NumpadAdd", "NumpadAdd", 3],
  ["{numpaddecimal}", 110, "NumpadDecimal", "NumpadDecimal", 3],
  ["{numpaddivide}", 111, "NumpadDivide", "NumpadDivide", 3],
  ["{numpadenter}", 13, "NumpadEnter", "NumpadEnter", 3],
  ["{numpadmultiply}", 106, "NumpadMultiply", "NumpadMultiply", 3],
  ["{numpadsubtract}", 109, "NumpadSubtract", "NumpadSubtract", 3],
  ["{pagedown}", 34, "PageDown", "PageDown", 0],
  ["{pageup}", 33, "PageUp", "PageUp", 0],
  ["{pause}", 19, "Pause", "Pause", 0],
  ["{prtscr}", 44, "PrintScreen", "PrintScreen", 0],
  ["{scrolllock}", 145, "ScrollLock", "ScrollLock", 0],
  ["{shiftleft}", 16, "ShiftLeft", "ShiftLeft", 1],
  ["{shiftright}", 16, "ShiftRight", "ShiftRight", 2],
  ["{space}", 32, "Space", "Space", 0],
  ["{tab}", 9, "Tab", "Tab", 0],
  ["|", 220, "Backslash", "|", 0],
  ["}", 221, "BracketRight", "}", 0],
  ["~", 192, "Backquote", "~", 0],
  ['"', 222, "Quote", '"', 0]
];
