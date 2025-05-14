import { VM } from './main';
import Keyboard from 'simple-keyboard';
import { OSK_buttonToKeysym } from './keyboard';

let commonKeyboardOptions = {
  onKeyPress: (button: string) => onKeyPress(button),
  theme: 'simple-keyboard hg-theme-default cvmDark cvmDisabled hg-layout-default',
  syncInstanceInputs: true,
  mergeDisplay: true
};

let keyboard = new Keyboard('.osk-main', {
  ...commonKeyboardOptions,
  layout: {
    default: [
      '{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}',
      '` 1 2 3 4 5 6 7 8 9 0 - = {backspace}',
      '{tab} q w e r t y u i o p [ ] \\',
      "{capslock} a s d f g h j k l ; ' {enter}",
      '{shiftleft} z x c v b n m , . / {shiftright}',
      '{controlleft} {metaleft} {altleft} {space} {altright} {metaright} {controlright}'
    ],
    shift: [
      '{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}',
      '~ ! @ # $ % ^ & * ( ) _ + {backspace}',
      '{tab} Q W E R T Y U I O P { } |',
      '{capslock} A S D F G H J K L : " {enter}',
      '{shiftleft} Z X C V B N M < > ? {shiftright}',
      '{controlleft} {metaleft} {altleft} {space} {altright} {metaright} {controlright}'
    ],
    capslock: [
      '{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}',
      '` 1 2 3 4 5 6 7 8 9 0 - = {backspace}',
      '{tab} Q W E R T Y U I O P [ ] \\',
      "{capslock} A S D F G H J K L ; ' {enter}",
      '{shiftleft} Z X C V B N M , . / {shiftright}',
      '{controlleft} {metaleft} {altleft} {space} {altright} {metaright} {controlright}'
    ],
    shiftcaps: [
      '{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}',
      '~ ! @ # $ % ^ & * ( ) _ + {backspace}',
      '{tab} q w e r t y u i o p { } |',
      '{capslock} a s d f g h j k l : " {enter}',
      '{shiftleft} z x c v b n m < > ? {shiftright}',
      '{controlleft} {metaleft} {altleft} {space} {altright} {metaright} {controlright}'
    ]
  },
  display: {
    '{escape}': 'Esc',
    '{tab}': 'Tab',
    '{backspace}': 'Back',
    '{enter}': 'Enter',
    '{capslock}': 'Caps',
    '{shiftleft}': 'Shift',
    '{shiftright}': 'Shift',
    '{controlleft}': 'Ctrl',
    '{controlright}': 'Ctrl',
    '{altleft}': 'Alt',
    '{altright}': 'Alt',
    '{metaleft}': 'Super',
    '{metaright}': 'Menu'
  }
});

let keyboardControlPad = new Keyboard('.osk-control', {
  ...commonKeyboardOptions,
  layout: {
    default: ['{prtscr} {scrolllock} {pause}', '{insert} {home} {pageup}', '{delete} {end} {pagedown}']
  },
  display: {
    '{prtscr}': 'Print',
    '{scrolllock}': 'Scroll',
    '{pause}': 'Pause',
    '{insert}': 'Ins',
    '{home}': 'Home',
    '{pageup}': 'PgUp',
    '{delete}': 'Del',
    '{end}': 'End',
    '{pagedown}': 'PgDn'
  }
});

let keyboardArrows = new Keyboard('.osk-arrows', {
  ...commonKeyboardOptions,
  layout: {
    default: ['{arrowup}', '{arrowleft} {arrowdown} {arrowright}']
  }
});

let keyboardNumPad = new Keyboard('.osk-numpad', {
  ...commonKeyboardOptions,
  layout: {
    default: ['{numlock} {numpaddivide} {numpadmultiply}', '{numpad7} {numpad8} {numpad9}', '{numpad4} {numpad5} {numpad6}', '{numpad1} {numpad2} {numpad3}', '{numpad0} {numpaddecimal}']
  }
});

let keyboardNumPadEnd = new Keyboard('.osk-numpadEnd', {
  ...commonKeyboardOptions,
  layout: {
    default: ['{numpadsubtract}', '{numpadadd}', '{numpadenter}']
  }
});

let shiftHeld = false;
let ctrlHeld = false;
let capsHeld = false;
let altHeld = false;
let metaHeld = false;

const setButtonBackground = (selectors: string, condition: boolean) => {
  for (let button of document.querySelectorAll(selectors) as NodeListOf<HTMLDivElement>) {
    button.style.backgroundColor = condition ? '#1c4995' : 'rgba(0, 0, 0, 0.5)';
  }
};

export function enableOSK(enable: boolean) {
    const theme = `simple-keyboard hg-theme-default cvmDark ${enable ? '' : 'cvmDisabled'} hg-layout-default`;
    [keyboard, keyboardControlPad, keyboardArrows, keyboardNumPad, keyboardNumPadEnd].forEach((part) => {
      part.setOptions({ theme });
    });
    if (enable) updateOSKStyle();
  }

const updateOSKStyle = () => {
  setButtonBackground('.hg-button-shiftleft, .hg-button-shiftright', shiftHeld);
  setButtonBackground('.hg-button-controlleft, .hg-button-controlright', ctrlHeld);
  setButtonBackground('.hg-button-capslock', capsHeld);
  setButtonBackground('.hg-button-altleft, .hg-button-altright', altHeld);
  setButtonBackground('.hg-button-metaleft, .hg-button-metaright', metaHeld);
};

function onKeyPress(button: string) {
  if (VM === null) return;
  let keysym = OSK_buttonToKeysym(button);
  if (!keysym) {
    console.error(`no keysym for ${button}, report this!`);
    return;
  }

  switch (true) {
    case button.startsWith('{shift'):
      shiftHeld = !shiftHeld;
      VM.key(keysym, shiftHeld);
      break;
    case button.startsWith('{control'):
      ctrlHeld = !ctrlHeld;
      VM.key(keysym, ctrlHeld);
      break;
    case button === '{capslock}':
      capsHeld = !capsHeld;
      VM.key(keysym, capsHeld);
      break;
    case button.startsWith('{alt'):
      altHeld = !altHeld;
      VM.key(keysym, altHeld);
      break;
    case button.startsWith('{meta'):
      metaHeld = !metaHeld;
      VM.key(keysym, metaHeld);
      break;
    default:
      VM.key(keysym, true);
      VM.key(keysym, false);
  }

  keyboard.setOptions({
    layoutName:
      shiftHeld && capsHeld ? 'shiftcaps' :
      shiftHeld             ? 'shift'     :
      capsHeld              ? 'capslock'  :
                              'default'
  });

  updateOSKStyle();
}
