// Pulled a bunch of functions out of the guac source code to get a keysym
// and then a wrapper
// shitty but it works so /shrug
export function GetKeysym(keyCode, keyIdentifier, key, location) {
    var keysym =  keysym_from_key_identifier(key, location)
        || keysym_from_keycode(keyCode, location);

    if (!keysym && key_identifier_sane(keyCode, keyIdentifier))
        keysym = keysym_from_key_identifier(keyIdentifier, location);

    return keysym;
}


function keysym_from_key_identifier(identifier, location) {

    if (!identifier)
        return null;

    var typedCharacter;

    // If identifier is U+xxxx, decode Unicode character 
    var unicodePrefixLocation = identifier.indexOf("U+");
    if (unicodePrefixLocation >= 0) {
        var hex = identifier.substring(unicodePrefixLocation+2);
        typedCharacter = String.fromCharCode(parseInt(hex, 16));
    }

    // If single character, use that as typed character
    else if (identifier.length === 1)
        typedCharacter = identifier;

    // Otherwise, look up corresponding keysym
    else
        return get_keysym(keyidentifier_keysym[identifier], location);

    // Get codepoint
    var codepoint = typedCharacter.charCodeAt(0);
    return keysym_from_charcode(codepoint);

}

function get_keysym(keysyms, location) {

    if (!keysyms)
        return null;

    return keysyms[location] || keysyms[0];
}

function keysym_from_charcode(codepoint) {

    // Keysyms for control characters
    if (isControlCharacter(codepoint)) return 0xFF00 | codepoint;

    // Keysyms for ASCII chars
    if (codepoint >= 0x0000 && codepoint <= 0x00FF)
        return codepoint;

    // Keysyms for Unicode
    if (codepoint >= 0x0100 && codepoint <= 0x10FFFF)
        return 0x01000000 | codepoint;

    return null;
}


function isControlCharacter(codepoint) {
    return codepoint <= 0x1F || (codepoint >= 0x7F && codepoint <= 0x9F);
}

function keysym_from_keycode(keyCode, location) {
    return get_keysym(keycodeKeysyms[keyCode], location);
}

function key_identifier_sane(keyCode, keyIdentifier) {

    // Missing identifier is not sane
    if (!keyIdentifier)
        return false;

    // Assume non-Unicode keyIdentifier values are sane
    var unicodePrefixLocation = keyIdentifier.indexOf("U+");
    if (unicodePrefixLocation === -1)
        return true;

    // If the Unicode codepoint isn't identical to the keyCode,
    // then the identifier is likely correct
    var codepoint = parseInt(keyIdentifier.substring(unicodePrefixLocation+2), 16);
    if (keyCode !== codepoint)
        return true;

    // The keyCodes for A-Z and 0-9 are actually identical to their
    // Unicode codepoints
    if ((keyCode >= 65 && keyCode <= 90) || (keyCode >= 48 && keyCode <= 57))
        return true;

    // The keyIdentifier does NOT appear sane
    return false;

}

var keyidentifier_keysym = {
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