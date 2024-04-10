import CollabVMClient from './protocol/CollabVMClient.js';
import VM from './protocol/VM.js';
import Config from '../../config.json';
import { Permissions, Rank } from './protocol/Permissions.js';
import { User } from './protocol/User.js';
import TurnStatus from './protocol/TurnStatus.js';
import Keyboard from 'simple-keyboard';
import { OSK_buttonToKeysym } from './keyboard';
import 'simple-keyboard/build/css/index.css';
import VoteStatus from './protocol/VoteStatus.js';
import * as bootstrap from 'bootstrap';
import MuteState from './protocol/MuteState.js';
import { Unsubscribe } from 'nanoevents';
import { I18nStringKey, TheI18n } from './i18n.js';
import { Format } from './format.js';
import AuthManager from './AuthManager.js';
import dayjs from 'dayjs';
import * as dompurify from 'dompurify';

// Elements
const w = window as any;
const elements = {
	vmlist: document.getElementById('vmlist') as HTMLDivElement,
	vmview: document.getElementById('vmview') as HTMLDivElement,
	vmDisplay: document.getElementById('vmDisplay') as HTMLDivElement,
	homeBtn: document.getElementById('homeBtn') as HTMLAnchorElement,
	rulesBtn: document.getElementById('rulesBtn') as HTMLAnchorElement,
	chatList: document.getElementById('chatList') as HTMLTableSectionElement,
	chatListDiv: document.getElementById('chatListDiv') as HTMLDivElement,
	userlist: document.getElementById('userlist') as HTMLTableSectionElement,
	onlineusercount: document.getElementById('onlineusercount') as HTMLSpanElement,
	username: document.getElementById('username') as HTMLSpanElement,
	chatinput: document.getElementById('chat-input') as HTMLInputElement,
	sendChatBtn: document.getElementById('sendChatBtn') as HTMLButtonElement,
	takeTurnBtn: document.getElementById('takeTurnBtn') as HTMLButtonElement,
	changeUsernameBtn: document.getElementById('changeUsernameBtn') as HTMLButtonElement,
	turnBtnText: document.getElementById('turnBtnText') as HTMLSpanElement,
	turnstatus: document.getElementById('turnstatus') as HTMLParagraphElement,
	osk: window.document.getElementById('oskBtn') as HTMLButtonElement,
	oskContainer: document.getElementById('osk-container') as HTMLDivElement,
	screenshotButton: document.getElementById('screenshotButton') as HTMLButtonElement,
	voteResetButton: document.getElementById('voteResetButton') as HTMLButtonElement,
	voteResetPanel: document.getElementById('voteResetPanel') as HTMLDivElement,
	voteYesBtn: document.getElementById('voteYesBtn') as HTMLButtonElement,
	voteNoBtn: document.getElementById('voteNoBtn') as HTMLButtonElement,
	voteYesLabel: document.getElementById('voteYesLabel') as HTMLSpanElement,
	voteNoLabel: document.getElementById('voteNoLabel') as HTMLSpanElement,
	voteTimeText: document.getElementById('voteTimeText') as HTMLSpanElement,
	loginModal: document.getElementById('loginModal') as HTMLDivElement,
	adminPassword: document.getElementById('adminPassword') as HTMLInputElement,
	loginButton: document.getElementById('loginButton') as HTMLButtonElement,
	adminInputVMID: document.getElementById('adminInputVMID') as HTMLInputElement,
	badPasswordAlert: document.getElementById('badPasswordAlert') as HTMLDivElement,
	incorrectPasswordDismissBtn: document.getElementById('incorrectPasswordDismissBtn') as HTMLButtonElement,
	ctrlAltDelBtn: document.getElementById('ctrlAltDelBtn') as HTMLButtonElement,
	toggleThemeBtn: document.getElementById('toggleThemeBtn') as HTMLAnchorElement,
	toggleThemeIcon: document.getElementById('toggleThemeIcon') as HTMLElement,
	toggleThemeBtnText: document.getElementById('toggleThemeBtnText') as HTMLSpanElement,
	// Admin
	staffbtns: document.getElementById('staffbtns') as HTMLDivElement,
	restoreBtn: document.getElementById('restoreBtn') as HTMLButtonElement,
	rebootBtn: document.getElementById('rebootBtn') as HTMLButtonElement,
	clearQueueBtn: document.getElementById('clearQueueBtn') as HTMLButtonElement,
	bypassTurnBtn: document.getElementById('bypassTurnBtn') as HTMLButtonElement,
	endTurnBtn: document.getElementById('endTurnBtn') as HTMLButtonElement,
	qemuMonitorBtn: document.getElementById('qemuMonitorBtn') as HTMLButtonElement,
	xssCheckboxContainer: document.getElementById('xssCheckboxContainer') as HTMLDivElement,
	xssCheckbox: document.getElementById('xssCheckbox') as HTMLInputElement,
	forceVotePanel: document.getElementById('forceVotePanel') as HTMLDivElement,
	forceVoteYesBtn: document.getElementById('forceVoteYesBtn') as HTMLButtonElement,
	forceVoteNoBtn: document.getElementById('forceVoteNoBtn') as HTMLButtonElement,
	indefTurnBtn: document.getElementById('indefTurnBtn') as HTMLButtonElement,
	qemuMonitorInput: document.getElementById('qemuMonitorInput') as HTMLInputElement,
	qemuMonitorSendBtn: document.getElementById('qemuMonitorSendBtn') as HTMLButtonElement,
	qemuMonitorOutput: document.getElementById('qemuMonitorOutput') as HTMLTextAreaElement,
	// Auth
	accountDropdownUsername: document.getElementById("accountDropdownUsername") as HTMLSpanElement,
	accountDropdownMenuLink: document.getElementById("accountDropdownMenuLink") as HTMLDivElement,
	accountLoginButton: document.getElementById("accountLoginButton") as HTMLAnchorElement,
	accountRegisterButton: document.getElementById("accountRegisterButton") as HTMLAnchorElement,
	accountSettingsButton: document.getElementById("accountSettingsButton") as HTMLAnchorElement,
	accountLogoutButton: document.getElementById("accountLogoutButton") as HTMLAnchorElement,
	accountModal: document.getElementById("accountModal") as HTMLDivElement,
	accountModalError: document.getElementById("accountModalError") as HTMLDivElement,
	accountModalErrorText: document.getElementById("accountModalErrorText") as HTMLSpanElement,
	accountModalErrorDismiss: document.getElementById("accountModalErrorDismiss") as HTMLButtonElement,
	accountModalSuccess: document.getElementById("accountModalSuccess") as HTMLDivElement,
	accountModalSuccessText: document.getElementById("accountModalSuccessText") as HTMLSpanElement,
	accountModalSuccessDismiss: document.getElementById("accountModalSuccessDismiss") as HTMLButtonElement,
	accountLoginSection: document.getElementById("accountLoginSection") as HTMLDivElement,
	accountRegisterSection: document.getElementById("accountRegisterSection") as HTMLDivElement,
	accountVerifyEmailSection: document.getElementById("accountVerifyEmailSection") as HTMLDivElement,
	accountVerifyEmailText: document.getElementById("accountVerifyEmailText") as HTMLParagraphElement,
	accountModalTitle: document.getElementById("accountModalTitle") as HTMLHeadingElement,
	accountLoginForm: document.getElementById("accountLoginForm") as HTMLFormElement,
	accountRegisterForm: document.getElementById("accountRegisterForm") as HTMLFormElement,
	accountVerifyEmailForm: document.getElementById("accountVerifyEmailForm") as HTMLFormElement,
	accountLoginCaptcha: document.getElementById("accountLoginCaptcha") as HTMLDivElement,
	accountRegisterCaptcha: document.getElementById("accountRegisterCaptcha") as HTMLDivElement,

	accountLoginUsername: document.getElementById("accountLoginUsername") as HTMLInputElement,
	accountLoginPassword: document.getElementById("accountLoginPassword") as HTMLInputElement,
	accountRegisterEmail: document.getElementById("accountRegisterEmail") as HTMLInputElement,
	accountRegisterUsername: document.getElementById("accountRegisterUsername") as HTMLInputElement,
	accountRegisterPassword: document.getElementById("accountRegisterPassword") as HTMLInputElement,
	accountRegisterConfirmPassword: document.getElementById("accountRegisterConfirmPassword") as HTMLInputElement,
	accountRegisterDateOfBirth: document.getElementById("accountRegisterDateOfBirth") as HTMLInputElement,
	accountVerifyEmailCode: document.getElementById("accountVerifyEmailCode") as HTMLInputElement,
	accountVerifyEmailPassword: document.getElementById("accountVerifyEmailPassword") as HTMLInputElement,

	accountSettingsSection: document.getElementById("accountSettingsSection") as HTMLDivElement,
	accountSettingsForm: document.getElementById("accountSettingsForm") as HTMLFormElement,
	accountSettingsEmail: document.getElementById("accountSettingsEmail") as HTMLInputElement,
	accountSettingsUsername: document.getElementById("accountSettingsUsername") as HTMLInputElement,
	accountSettingsNewPassword: document.getElementById("accountSettingsNewPassword") as HTMLInputElement,
	accountSettingsConfirmNewPassword: document.getElementById("accountSettingsConfirmNewPassword") as HTMLInputElement,
	accountSettingsCurrentPassword: document.getElementById("accountSettingsCurrentPassword") as HTMLInputElement,

	accountResetPasswordSection: document.getElementById("accountResetPasswordSection") as HTMLDivElement,
	accountResetPasswordForm: document.getElementById("accountResetPasswordForm") as HTMLFormElement,
	accountResetPasswordEmail: document.getElementById("accountResetPasswordEmail") as HTMLInputElement,
	accountResetPasswordUsername: document.getElementById("accountResetPasswordUsername") as HTMLInputElement,
	accountResetPasswordCaptcha: document.getElementById("accountResetPasswordCaptcha") as HTMLDivElement,

	accountResetPasswordVerifySection: document.getElementById("accountResetPasswordVerifySection") as HTMLDivElement,
	accountVerifyPasswordResetText: document.getElementById("accountVerifyPasswordResetText") as HTMLParagraphElement,
	accountResetPasswordVerifyForm: document.getElementById("accountResetPasswordVerifyForm") as HTMLFormElement,
	accountResetPasswordCode: document.getElementById("accountResetPasswordCode") as HTMLInputElement,
	accountResetPasswordNewPassword: document.getElementById("accountResetPasswordNewPassword") as HTMLInputElement,
	accountResetPasswordConfirmNewPassword: document.getElementById("accountResetPasswordConfirmNewPassword") as HTMLInputElement,
	accountForgotPasswordButton: document.getElementById("accountForgotPasswordButton") as HTMLButtonElement,
};

let auth : AuthManager|null = null;

/* Start OSK */
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

const enableOSK = (enable: boolean) => {
	const theme = `simple-keyboard hg-theme-default cvmDark ${enable ? '' : 'cvmDisabled'} hg-layout-default`;
	[keyboard, keyboardControlPad, keyboardArrows, keyboardNumPad, keyboardNumPadEnd].forEach((part) => {
		part.setOptions({
			theme: theme
		});
	});

	if (enable) updateOSKStyle();
};

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
		layoutName: shiftHeld && capsHeld ? 'shiftcaps' : shiftHeld ? 'shift' : capsHeld ? 'capslock' : 'default'
	});

	updateOSKStyle();
}

/* End OSK */

let expectedClose = false;
let turn = -1;
// Listed VMs
const vms: VM[] = [];
const cards: HTMLDivElement[] = [];
const users: {
	user: User;
	element: HTMLTableRowElement;
}[] = [];
let turnInterval: number | undefined = undefined;
let voteInterval: number | undefined = undefined;
let turnTimer = 0;
let voteTimer = 0;
let rank: Rank = Rank.Unregistered;
let perms: Permissions = new Permissions(0);
const chatsound = new Audio(Config.ChatSound);

// Active VM
let VM: CollabVMClient | null = null;

async function multicollab(url: string) {
	// Create the client
	let client = new CollabVMClient(url);

	await client.WaitForOpen();

	// Get the list of VMs
	let list = await client.list();

	// Get the number of online users
	let online = client.getUsers().length;

	// Close the client
	client.close();

	// Add to the list
	vms.push(...list);

	// Add to the DOM
	for (let vm of list) {
		let div = document.createElement('div');
		div.classList.add('col-sm-5', 'col-md-3');
		let card = document.createElement('div');
		card.classList.add('card');
		if (Config.NSFWVMs.indexOf(vm.id) !== -1) card.classList.add('cvm-nsfw');
		card.setAttribute('data-cvm-node', vm.id);
		card.addEventListener('click', async () => {
			try {
				await openVM(vm);
			} catch (e) {
				alert((e as Error).message);
			}
		});
		vm.thumbnail.classList.add('card-img-top');
		let cardBody = document.createElement('div');
		cardBody.classList.add('card-body');
		let cardTitle = document.createElement('h5');
		cardTitle.innerHTML = Config.RawMessages.VMTitles ? vm.displayName : dompurify.sanitize(vm.displayName);
		let usersOnline = document.createElement('span');
		usersOnline.innerHTML = `(<i class="fa-solid fa-users"></i> ${online})`;
		cardBody.appendChild(cardTitle);
		cardBody.appendChild(usersOnline);
		card.appendChild(vm.thumbnail);
		card.appendChild(cardBody);
		div.appendChild(card);
		cards.push(div);
		sortVMList();
	}
}

async function openVM(vm: VM): Promise<void> {
	// If there's an active VM it must be closed before opening another
	if (VM !== null) return;
	expectedClose = false;
	// Set hash
	location.hash = vm.id;
	// Create the client
	VM = new CollabVMClient(vm.url);

	// Register event listeners

	VM!.on('chat', (username, message) => chatMessage(username, message));
	VM!.on('adduser', (user) => addUser(user));
	VM!.on('remuser', (user) => remUser(user));
	VM!.on('rename', (oldname, newname, selfrename) => userRenamed(oldname, newname, selfrename));

	VM!.on('renamestatus', (status) => {
		// TODO: i18n these
		switch (status) {
			case 'taken':
				alert(TheI18n.GetString(I18nStringKey.kError_UsernameTaken));
				break;
			case 'invalid':
				alert(TheI18n.GetString(I18nStringKey.kError_UsernameInvalid));
				break;
			case 'blacklisted':
				alert(TheI18n.GetString(I18nStringKey.kError_UsernameBlacklisted));
				break;
		}
	});

	VM!.on('turn', (status) => turnUpdate(status));
	VM!.on('vote', (status: VoteStatus) => voteUpdate(status));
	VM!.on('voteend', () => voteEnd());
	VM!.on('votecd', (voteCooldown) => window.alert(TheI18n.GetString(I18nStringKey.kVM_VoteCooldownTimer, voteCooldown)));
	VM!.on('login', (rank: Rank, perms: Permissions) => onLogin(rank, perms));

	VM!.on('close', () => {
		if (!expectedClose) alert(TheI18n.GetString(I18nStringKey.kError_UnexpectedDisconnection));
		closeVM();
	});

	// auth
	VM!.on('auth', async server => {
		elements.changeUsernameBtn.style.display = "none";
		if (Config.Auth.Enabled && Config.Auth.APIEndpoint === server && auth!.account) {
			VM!.loginAccount(auth!.account.sessionToken);
		} else if (!Config.Auth.Enabled || Config.Auth.APIEndpoint !== server) {
			auth = new AuthManager(server);
			await renderAuth();
		}
	});

	// Wait for the client to open
	await VM!.WaitForOpen();

	// Connect to node
	chatMessage('', `<b>${vm.id}</b><hr>`);
	let username = Config.Auth.Enabled ? (auth!.account?.username ?? null) : localStorage.getItem('username');
	let connected = await VM.connect(vm.id, username);
	elements.adminInputVMID.value = vm.id;
	w.VMName = vm.id;
	if (!connected) {
		// just give up
		closeVM();
		throw new Error('Failed to connect to node');
	}
	// Set the title
	document.title = Format('{0} - {1}', vm.id, TheI18n.GetString(I18nStringKey.kGeneric_CollabVM));
	// Append canvas
	elements.vmDisplay.appendChild(VM!.canvas);
	// Switch to the VM view
	elements.vmlist.style.display = 'none';
	elements.vmview.style.display = 'block';
	return;
}

function closeVM() {
	if (VM === null) return;
	expectedClose = true;
	// Close the VM
	VM.close();
	VM = null;
	document.title = TheI18n.GetString(I18nStringKey.kGeneric_CollabVM);
	turn = -1;
	// Remove the canvas
	elements.vmDisplay.innerHTML = '';
	// Switch to the VM list
	elements.vmlist.style.display = 'block';
	elements.vmview.style.display = 'none';
	// Clear users
	users.splice(0, users.length);
	elements.userlist.innerHTML = '';
	rank = Rank.Unregistered;
	perms.set(0);
	w.VMName = null;
	// Reset admin and vote panels
	elements.staffbtns.style.display = 'none';
	elements.restoreBtn.style.display = 'none';
	elements.rebootBtn.style.display = 'none';
	elements.bypassTurnBtn.style.display = 'none';
	elements.endTurnBtn.style.display = 'none';
	elements.clearQueueBtn.style.display = 'none';
	elements.qemuMonitorBtn.style.display = 'none';
	elements.indefTurnBtn.style.display = 'none';
	elements.xssCheckboxContainer.style.display = 'none';
	elements.forceVotePanel.style.display = 'none';
	elements.voteResetPanel.style.display = 'none';
	elements.voteYesLabel.innerText = '0';
	elements.voteNoLabel.innerText = '0';
	elements.xssCheckbox.checked = false;
	elements.username.classList.remove('username-admin', 'username-moderator', 'username-registered');
	elements.username.classList.add('username-unregistered');
	// Reset rename button
	elements.changeUsernameBtn.style.display = "inline-block";
	// Reset auth if it was changed by the VM
	if (Config.Auth.Enabled && auth?.apiEndpoint !== Config.Auth.APIEndpoint) {
		auth = new AuthManager(Config.Auth.APIEndpoint);
		renderAuth();
	} else if (auth && !Config.Auth.Enabled) {
		auth = null;
		elements.accountDropdownMenuLink.style.display = "none";
	}
}

async function loadList() {
	var jsonVMs = Config.ServerAddressesListURI === null ? [] : await (await fetch(Config.ServerAddressesListURI)).json();
	await Promise.all(
		[Config.ServerAddresses, jsonVMs].flat().map((url) => {
			return multicollab(url);
		})
	);

	// automatically join the vm that's in the url if it exists in the node list
	let v = vms.find((v) => v.id === window.location.hash.substring(1));
	try {
		if (v !== undefined) await openVM(v);
	} catch (e) {
		alert((e as Error).message);
	}
}

function sortVMList() {
	cards.sort((a, b) => {
		return a.children[0].getAttribute('data-cvm-node')! > b.children[0].getAttribute('data-cvm-node')! ? 1 : -1;
	});
	elements.vmlist.children[0].innerHTML = '';
	cards.forEach((c) => elements.vmlist.children[0].appendChild(c));
}

function sortUserList() {
	users.sort((a, b) => {
		if (a.user.username === w.username && a.user.turn >= b.user.turn && b.user.turn !== 0) return -1;
		if (b.user.username === w.username && b.user.turn >= a.user.turn && a.user.turn !== 0) return 1;
		if (a.user.turn === b.user.turn) return 0;
		if (a.user.turn === -1) return 1;
		if (b.user.turn === -1) return -1;
		if (a.user.turn < b.user.turn) return -1;
		else return 1;
	});
	for (const user of users) {
		elements.userlist.removeChild(user.element);
		elements.userlist.appendChild(user.element);
	}
}

function chatMessage(username: string, message: string) {
	let tr = document.createElement('tr');
	let td = document.createElement('td');
	if (!Config.RawMessages.Messages) message = dompurify.sanitize(message);
	// System message
	if (username === '') td.innerHTML = message;
	else {
		let user = VM!.getUsers().find((u) => u.username === username);
		let rank;
		if (user !== undefined) rank = user.rank;
		else rank = Rank.Unregistered;
		let userclass;
		let msgclass;
		switch (rank) {
			case Rank.Unregistered:
				userclass = 'chat-username-unregistered';
				msgclass = 'chat-unregistered';
				break;
			case Rank.Registered:
				userclass = 'chat-username-registered';
				msgclass = 'chat-registered';
				break;
			case Rank.Admin:
				userclass = 'chat-username-admin';
				msgclass = 'chat-admin';
				break;
			case Rank.Moderator:
				userclass = 'chat-username-moderator';
				msgclass = 'chat-moderator';
				break;
		}
		tr.classList.add(msgclass);
		td.innerHTML = `<b class="${userclass}">${username}▸</b> ${message}`;
		// hacky way to allow scripts
		if (Config.RawMessages.Messages) Array.prototype.slice.call(td.children).forEach((curr) => {
			if (curr.nodeName === 'SCRIPT') {
				eval(curr.text);
			}
		});
	}
	tr.appendChild(td);
	elements.chatList.appendChild(tr);
	elements.chatListDiv.scrollTop = elements.chatListDiv.scrollHeight;
	chatsound.play();
}

function addUser(user: User) {
	let olduser = users.find((u) => u.user === user);
	if (olduser !== undefined) elements.userlist.removeChild(olduser.element);
	let tr = document.createElement('tr');
	tr.setAttribute('data-cvm-turn', '-1');
	let td = document.createElement('td');
	td.innerHTML = user.username;
	switch (user.rank) {
		case Rank.Admin:
			tr.classList.add('user-admin');
			break;
		case Rank.Moderator:
			tr.classList.add('user-moderator');
			break;
		case Rank.Registered:
			tr.classList.add('user-registered');
			break;
		case Rank.Unregistered:
			tr.classList.add('user-unregistered');
			break;
	}
	if (user.username === w.username) tr.classList.add('user-current');
	tr.appendChild(td);
	let u = { user: user, element: tr };
	if (rank === Rank.Admin || rank === Rank.Moderator) userModOptions(u);
	elements.userlist.appendChild(tr);
	if (olduser !== undefined) olduser.element = tr;
	else users.push(u);
	elements.onlineusercount.innerHTML = VM!.getUsers().length.toString();
}

function remUser(user: User) {
	let olduser = users.findIndex((u) => u.user === user);
	if (olduser !== undefined) elements.userlist.removeChild(users[olduser].element);
	elements.onlineusercount.innerHTML = VM!.getUsers().length.toString();
	users.splice(olduser, 1);
}

function userRenamed(oldname: string, newname: string, selfrename: boolean) {
	let user = users.find((u) => u.user.username === newname);
	if (user) {
		user.element.children[0].innerHTML = newname;
	}
	if (selfrename) {
		w.username = newname;
		elements.username.innerText = newname;
		localStorage.setItem('username', newname);
	}
}

function turnUpdate(status: TurnStatus) {
	// Clear all turn data
	turn = -1;
	VM!.canvas.classList.remove('focused', 'waiting');
	clearInterval(turnInterval);
	turnTimer = 0;
	for (const user of users) {
		user.element.classList.remove('user-turn', 'user-waiting');
		user.element.setAttribute('data-cvm-turn', '-1');
	}
	elements.turnBtnText.innerHTML = TheI18n.GetString(I18nStringKey.kVMButtons_TakeTurn);
	enableOSK(false);

	if (status.user !== null) {
		let el = users.find((u) => u.user === status.user)!.element;
		el!.classList.add('user-turn');
		el!.setAttribute('data-cvm-turn', '0');
	}
	for (const user of status.queue) {
		let el = users.find((u) => u.user === user)!.element;
		el!.classList.add('user-waiting');
		el.setAttribute('data-cvm-turn', status.queue.indexOf(user).toString(10));
	}
	if (status.user?.username === w.username) {
		turn = 0;
		turnTimer = status.turnTime! / 1000;
		elements.turnBtnText.innerHTML = TheI18n.GetString(I18nStringKey.kVMButtons_EndTurn);
		VM!.canvas.classList.add('focused');
		enableOSK(true);
	}
	if (status.queue.some((u) => u.username === w.username)) {
		turn = status.queue.findIndex((u) => u.username === w.username) + 1;
		turnTimer = status.queueTime! / 1000;
		elements.turnBtnText.innerHTML = TheI18n.GetString(I18nStringKey.kVMButtons_EndTurn);
		VM!.canvas.classList.add('waiting');
	}
	if (turn === -1) elements.turnstatus.innerText = '';
	else {
		//@ts-ignore
		turnInterval = setInterval(() => turnIntervalCb(), 1000);
		setTurnStatus();
	}
	sortUserList();
}

function voteUpdate(status: VoteStatus) {
	clearInterval(voteInterval);
	elements.voteResetPanel.style.display = 'block';
	elements.voteYesLabel.innerText = status.yesVotes.toString();
	elements.voteNoLabel.innerText = status.noVotes.toString();
	voteTimer = Math.floor(status.timeToEnd / 1000);
	//@ts-ignore
	voteInterval = setInterval(() => updateVoteEndTime(), 1000);
	updateVoteEndTime();
}

function updateVoteEndTime() {
	voteTimer--;
	elements.voteTimeText.innerText = TheI18n.GetString(I18nStringKey.kVM_VoteForResetTimer, voteTimer);
	if (voteTimer === 0) clearInterval(voteInterval);
}

function voteEnd() {
	clearInterval(voteInterval);
	elements.voteResetPanel.style.display = 'none';
}

function turnIntervalCb() {
	turnTimer--;
	setTurnStatus();
}

function setTurnStatus() {
	if (turn === 0) elements.turnstatus.innerText = TheI18n.GetString(I18nStringKey.kVM_TurnTimeTimer, turnTimer);
	else elements.turnstatus.innerText = TheI18n.GetString(I18nStringKey.kVM_WaitingTurnTimer, turnTimer);
}

function sendChat() {
	if (VM === null) return;
	if (elements.xssCheckbox.checked) VM.xss(elements.chatinput.value);
	else VM.chat(elements.chatinput.value);
	elements.chatinput.value = '';
}

// Bind list buttons
elements.homeBtn.addEventListener('click', () => closeVM());

// Bind VM view buttons
elements.sendChatBtn.addEventListener('click', sendChat);
elements.chatinput.addEventListener('keypress', (e) => {
	if (e.key === 'Enter') sendChat();
});
elements.changeUsernameBtn.addEventListener('click', () => {
	let newname = prompt(TheI18n.GetString(I18nStringKey.kVMPrompts_EnterNewUsernamePrompt), w.username);
	if (newname === w.username) return;
	VM?.rename(newname);
});
elements.takeTurnBtn.addEventListener('click', () => {
	VM?.turn(turn === -1);
});
elements.screenshotButton.addEventListener('click', () => {
	if (!VM) return;
	VM.canvas.toBlob((blob) => {
		open(URL.createObjectURL(blob!), '_blank');
	});
});
elements.ctrlAltDelBtn.addEventListener('click', () => {
	if (!VM) return;
	// Ctrl
	VM?.key(0xffe3, true);
	// Alt
	VM?.key(0xffe9, true);
	// Del
	VM?.key(0xffff, true);
	// Ctrl
	VM?.key(0xffe3, false);
	// Alt
	VM?.key(0xffe9, false);
	// Del
	VM?.key(0xffff, false);
});
elements.voteResetButton.addEventListener('click', () => VM?.vote(true));
elements.voteYesBtn.addEventListener('click', () => VM?.vote(true));
elements.voteNoBtn.addEventListener('click', () => VM?.vote(false));
// Login
let usernameClick = false;
const loginModal = new bootstrap.Modal(elements.loginModal);
elements.loginModal.addEventListener('shown.bs.modal', () => elements.adminPassword.focus());
elements.username.addEventListener('click', () => {
	if (auth) return;
	if (!usernameClick) {
		usernameClick = true;
		setInterval(() => (usernameClick = false), 1000);
		return;
	}
	loginModal.show();
});
elements.loginButton.addEventListener('click', () => doLogin());
elements.adminPassword.addEventListener('keypress', (e) => e.key === 'Enter' && doLogin());
elements.incorrectPasswordDismissBtn.addEventListener('click', () => (elements.badPasswordAlert.style.display = 'none'));
function doLogin() {
	let adminPass = elements.adminPassword.value;
	if (adminPass === '') return;
	VM?.login(adminPass);
	elements.adminPassword.value = '';
	let u = VM?.on('login', () => {
		u!();
		loginModal.hide();
		elements.badPasswordAlert.style.display = 'none';
	});
	let _u = VM?.on('badpw', () => {
		_u!();
		elements.badPasswordAlert.style.display = 'block';
	});
}

function onLogin(_rank: Rank, _perms: Permissions) {
	rank = _rank;
	perms = _perms;
	elements.username.classList.remove('username-unregistered', 'username-registered');
	if (rank === Rank.Admin) elements.username.classList.add('username-admin');
	if (rank === Rank.Moderator) elements.username.classList.add('username-moderator');
	if (rank === Rank.Registered) elements.username.classList.add('username-registered');
	elements.staffbtns.style.display = 'block';
	if (_perms.restore) elements.restoreBtn.style.display = 'inline-block';
	if (_perms.reboot) elements.rebootBtn.style.display = 'inline-block';
	if (_perms.bypassturn) {
		elements.bypassTurnBtn.style.display = 'inline-block';
		elements.endTurnBtn.style.display = 'inline-block';
		elements.clearQueueBtn.style.display = 'inline-block';
	}
	if (_rank === Rank.Admin) {
		elements.qemuMonitorBtn.style.display = 'inline-block';
		elements.indefTurnBtn.style.display = 'inline-block';
	}
	if (_perms.xss) elements.xssCheckboxContainer.style.display = 'inline-block';
	if (_perms.forcevote) elements.forceVotePanel.style.display = 'block';
	if (rank !== Rank.Registered)
		for (const user of users) userModOptions(user);
}

function userModOptions(user: { user: User; element: HTMLTableRowElement }) {
	let tr = user.element;
	let td = tr.children[0] as HTMLTableCellElement;
	tr.classList.add('dropdown');
	td.classList.add('dropdown-toggle');
	td.setAttribute('data-bs-toggle', 'dropdown');
	td.setAttribute('role', 'button');
	td.setAttribute('aria-expanded', 'false');
	let ul = document.createElement('ul');
	ul.classList.add('dropdown-menu', 'dropdown-menu-dark', 'table-dark', 'text-light');
	if (perms.bypassturn) addUserDropdownItem(ul, TheI18n.GetString(I18nStringKey.kVMButtons_EndTurn), () => VM!.endTurn(user.user.username), "mod-end-turn-btn");
	if (perms.ban) addUserDropdownItem(ul, TheI18n.GetString(I18nStringKey.kAdminVMButtons_Ban), () => VM!.ban(user.user.username), "mod-ban-btn");
	if (perms.kick) addUserDropdownItem(ul, TheI18n.GetString(I18nStringKey.kAdminVMButtons_Kick), () => VM!.kick(user.user.username), "mod-kick-btn");
	if (perms.rename)
		addUserDropdownItem(ul, TheI18n.GetString(I18nStringKey.kVMButtons_ChangeUsername), () => {
			let newname = prompt(TheI18n.GetString(I18nStringKey.kVMPrompts_AdminChangeUsernamePrompt, user.user.username));
			if (!newname) return;
			VM!.renameUser(user.user.username, newname);
		}, "mod-rename-btn");
	if (perms.mute) {
		addUserDropdownItem(ul, TheI18n.GetString(I18nStringKey.kAdminVMButtons_TempMute), () => VM!.mute(user.user.username, MuteState.Temp), "mod-temp-mute-btn");
		addUserDropdownItem(ul, TheI18n.GetString(I18nStringKey.kAdminVMButtons_IndefMute), () => VM!.mute(user.user.username, MuteState.Perma), "mod-indef-mute-btn");
		addUserDropdownItem(ul, TheI18n.GetString(I18nStringKey.kAdminVMButtons_Unmute), () => VM!.mute(user.user.username, MuteState.Unmuted), "mod-unmute-btn");
	}
	if (perms.grabip)
		addUserDropdownItem(ul, TheI18n.GetString(I18nStringKey.kAdminVMButtons_GetIP), async () => {
			let ip = await VM!.getip(user.user.username);
			alert(ip);
		}, "mod-get-ip-btn");
	tr.appendChild(ul);
}

function addUserDropdownItem(ul: HTMLUListElement, text: string, func: () => void, classname: string) {
	let li = document.createElement('li');
	let a = document.createElement('a');
	a.href = '#';
	a.classList.add('dropdown-item', classname);
	a.innerHTML = text;
	a.addEventListener('click', () => func());
	li.appendChild(a);
	ul.appendChild(li);
}

// Admin buttons
elements.restoreBtn.addEventListener('click', () => window.confirm(TheI18n.GetString(I18nStringKey.kVMPrompts_AdminRestoreVMPrompt)) && VM?.restore());
elements.rebootBtn.addEventListener('click', () => VM?.reboot());
elements.clearQueueBtn.addEventListener('click', () => VM?.clearQueue());
elements.bypassTurnBtn.addEventListener('click', () => VM?.bypassTurn());
elements.endTurnBtn.addEventListener('click', () => {
	let user = VM?.getUsers().find((u) => u.turn === 0);
	if (user) VM?.endTurn(user.username);
});
elements.forceVoteNoBtn.addEventListener('click', () => VM?.forceVote(false));
elements.forceVoteYesBtn.addEventListener('click', () => VM?.forceVote(true));
elements.indefTurnBtn.addEventListener('click', () => VM?.indefiniteTurn());

async function sendQEMUCommand() {
	if (!elements.qemuMonitorInput.value) return;
	let cmd = elements.qemuMonitorInput.value;
	elements.qemuMonitorOutput.innerHTML += `&gt; ${cmd}\n`;
	elements.qemuMonitorInput.value = '';
	let response = await VM?.qemuMonitor(cmd);
	elements.qemuMonitorOutput.innerHTML += `${response}\n`;
	elements.qemuMonitorOutput.scrollTop = elements.qemuMonitorOutput.scrollHeight;
}
elements.qemuMonitorSendBtn.addEventListener('click', () => sendQEMUCommand());
elements.qemuMonitorInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendQEMUCommand());

elements.osk.addEventListener('click', () => elements.oskContainer.classList.toggle('d-none'));
// Auth stuff
async function renderAuth() {
	if (auth === null) throw new Error("Cannot renderAuth when auth is null.");
	await auth.getAPIInformation();
	elements.accountDropdownUsername.innerText = TheI18n.GetString(I18nStringKey.kNotLoggedIn);
	elements.accountDropdownMenuLink.style.display = "block";
	if (!auth!.info!.registrationOpen)
		elements.accountRegisterButton.style.display = "none";
	else
		elements.accountRegisterButton.style.display = "block";
	elements.accountLoginButton.style.display = "block";
	elements.accountSettingsButton.style.display = "none";
	elements.accountLogoutButton.style.display = "none";
	elements.accountRegisterCaptcha.innerHTML = "";
	elements.accountLoginCaptcha.innerHTML = "";
	elements.accountResetPasswordCaptcha.innerHTML = "";
	if (auth!.info!.hcaptcha.required) {
		var hconfig = {sitekey: auth!.info!.hcaptcha.siteKey!};
		hcaptcha.render(elements.accountRegisterCaptcha, hconfig);
		hcaptcha.render(elements.accountLoginCaptcha, hconfig);
		hcaptcha.render(elements.accountResetPasswordCaptcha, hconfig);
	}
	var token = localStorage.getItem("collabvm_session_" + new URL(auth!.apiEndpoint).host);
	if (token) {
		var result = await auth!.loadSession(token);
		if (result.success) {
			loadAccount();
		} else {
			localStorage.removeItem("collabvm_session_" + new URL(auth!.apiEndpoint).host);
		}
	}
}
function loadAccount() {
	if (auth === null || auth.account === null) throw new Error("Cannot loadAccount when auth or auth.account is null.");
	elements.accountDropdownUsername.innerText = auth!.account!.username;
	elements.accountLoginButton.style.display = "none";
	elements.accountRegisterButton.style.display = "none";
	elements.accountSettingsButton.style.display = "block";
	elements.accountLogoutButton.style.display = "block";
	if (VM) VM.loginAccount(auth.account.sessionToken);
}
const accountModal = new bootstrap.Modal(elements.accountModal);
elements.accountModalErrorDismiss.addEventListener('click', () => elements.accountModalError.style.display = "none");
elements.accountModalSuccessDismiss.addEventListener('click', () => elements.accountModalSuccess.style.display = "none");
elements.accountLoginButton.addEventListener("click", () => {
	elements.accountModalTitle.innerText = TheI18n.GetString(I18nStringKey.kGeneric_Login);
	elements.accountRegisterSection.style.display = "none";
	elements.accountVerifyEmailSection.style.display = "none";
	elements.accountLoginSection.style.display = "block";
	elements.accountSettingsSection.style.display = "none";
	elements.accountResetPasswordSection.style.display = "none";
	elements.accountResetPasswordVerifySection.style.display = "none";
	accountModal.show();
});
elements.accountRegisterButton.addEventListener("click", () => {
	elements.accountModalTitle.innerText = TheI18n.GetString(I18nStringKey.kGeneric_Register);
	elements.accountRegisterSection.style.display = "block";
	elements.accountVerifyEmailSection.style.display = "none";
	elements.accountLoginSection.style.display = "none";
	elements.accountSettingsSection.style.display = "none";
	elements.accountResetPasswordSection.style.display = "none";
	elements.accountResetPasswordVerifySection.style.display = "none";
	accountModal.show();
});
elements.accountSettingsButton.addEventListener("click", () => {
	elements.accountModalTitle.innerText = TheI18n.GetString(I18nStringKey.kAccountModal_AccountSettings);
	elements.accountRegisterSection.style.display = "none";
	elements.accountVerifyEmailSection.style.display = "none";
	elements.accountLoginSection.style.display = "none";
	elements.accountSettingsSection.style.display = "block";
	elements.accountResetPasswordSection.style.display = "none";
	elements.accountResetPasswordVerifySection.style.display = "none";
	// Fill fields
	elements.accountSettingsUsername.value = auth!.account!.username;
	elements.accountSettingsEmail.value = auth!.account!.email;
	accountModal.show();
});
elements.accountLogoutButton.addEventListener('click', async () => {
	if (!auth?.account) return;
	await auth.logout();
	localStorage.removeItem("collabvm_session_" + new URL(auth!.apiEndpoint).host);
	if (VM) closeVM();
	renderAuth();
});
elements.accountForgotPasswordButton.addEventListener('click', () => {
	elements.accountModalTitle.innerText = TheI18n.GetString(I18nStringKey.kAccountModal_ResetPassword);
	elements.accountLoginSection.style.display = "none";
	elements.accountResetPasswordSection.style.display = "block";
});
// i dont know if theres a better place to put this
let accountBeingVerified;
elements.accountLoginForm.addEventListener('submit', async (e) => {
	e.preventDefault();
	var hcaptchaToken = undefined;
	var hcaptchaID = undefined;
	if (auth!.info!.hcaptcha.required) {
		hcaptchaID = elements.accountLoginCaptcha.children[0].getAttribute("data-hcaptcha-widget-id")!
		var response = hcaptcha.getResponse(hcaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		hcaptchaToken = response;
	}
	var username = elements.accountLoginUsername.value;
	var password = elements.accountLoginPassword.value;
	var result = await auth!.login(username, password, hcaptchaToken);
	if (auth!.info!.hcaptcha.required) hcaptcha.reset(hcaptchaID);
	if (result.success) {
		elements.accountLoginUsername.value = "";
		elements.accountLoginPassword.value = "";
		if (result.verificationRequired) {
			accountBeingVerified = result.username;
			elements.accountVerifyEmailText.innerText = TheI18n.GetString(I18nStringKey.kAccountModal_VerifyText, result.email!);
			elements.accountLoginSection.style.display = "none";
			elements.accountVerifyEmailSection.style.display = "block";
			return false;
		}
		localStorage.setItem("collabvm_session_" + new URL(auth!.apiEndpoint).host, result.token!);
		loadAccount();
		accountModal.hide();
	} else {
		elements.accountModalErrorText.innerHTML = result.error!;
		elements.accountModalError.style.display = "block";
	}
	return false;
});
elements.accountRegisterForm.addEventListener('submit', async (e) => {
	e.preventDefault();
	var hcaptchaToken = undefined;
	var hcaptchaID = undefined;
	if (auth!.info!.hcaptcha.required) {
		hcaptchaID = elements.accountRegisterCaptcha.children[0].getAttribute("data-hcaptcha-widget-id")!
		var response = hcaptcha.getResponse(hcaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		hcaptchaToken = response;
	}
	var username = elements.accountRegisterUsername.value;
	var password = elements.accountRegisterPassword.value;
	var email = elements.accountRegisterEmail.value;
	var dob = dayjs(elements.accountRegisterDateOfBirth.valueAsDate);
	if (password !== elements.accountRegisterConfirmPassword.value) {
		elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kPasswordsMustMatch);
		elements.accountModalError.style.display = "block";
		return false;
	}
	var result = await auth!.register(username, password, email, dob, hcaptchaToken);
	if (auth!.info!.hcaptcha.required) hcaptcha.reset(hcaptchaID);
	if (result.success) {
		elements.accountRegisterUsername.value = "";
		elements.accountRegisterEmail.value = "";
		elements.accountRegisterPassword.value = "";
		elements.accountRegisterConfirmPassword.value = "";
		elements.accountRegisterDateOfBirth.value = "";
		if (result.verificationRequired) {
			accountBeingVerified = result.username;
			elements.accountVerifyEmailText.innerText = TheI18n.GetString(I18nStringKey.kAccountModal_VerifyText, result.email!);
			elements.accountRegisterSection.style.display = "none";
			elements.accountVerifyEmailSection.style.display = "block";
			return false;
		}
		localStorage.setItem("collabvm_session_" + new URL(auth!.apiEndpoint).host, result.sessionToken!);
		await auth!.loadSession(result.sessionToken!);
		loadAccount();
		accountModal.hide();
	} else {
		elements.accountModalErrorText.innerHTML = result.error!;
		elements.accountModalError.style.display = "block";
	}
	return false;
});
elements.accountVerifyEmailForm.addEventListener('submit', async e => {
	e.preventDefault();
	var username = accountBeingVerified!;
	var code = elements.accountVerifyEmailCode.value;
	var password = elements.accountVerifyEmailPassword.value;
	var result = await auth!.verifyEmail(username, password, code);
	if (result.success) {
		elements.accountVerifyEmailCode.value = "";
		elements.accountVerifyEmailPassword.value = "";
		localStorage.setItem("collabvm_session_" + new URL(auth!.apiEndpoint).host, result.sessionToken!);
		await auth!.loadSession(result.sessionToken!);
		loadAccount();
		accountModal.hide();
	} else {
		elements.accountModalErrorText.innerHTML = result.error!;
		elements.accountModalError.style.display = "block";
	}
	return false;
});
elements.accountSettingsForm.addEventListener('submit', async e => {
	e.preventDefault();
	var oldUsername = auth!.account!.username;
	var oldEmail = auth!.account!.email;
	var username = elements.accountSettingsUsername.value === auth!.account!.username ? undefined : elements.accountSettingsUsername.value;
	var email = elements.accountSettingsEmail.value === auth!.account!.email ? undefined : elements.accountSettingsEmail.value;
	var password = elements.accountSettingsNewPassword.value === "" ? undefined : elements.accountSettingsNewPassword.value;
	var currentPassword = elements.accountSettingsCurrentPassword.value;
	if (password && password !== elements.accountSettingsConfirmNewPassword.value) {
		elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kPasswordsMustMatch);
		elements.accountModalError.style.display = "block";
		return false;
	}
	var result = await auth!.updateAccount(currentPassword, email, username, password);
	if (result.success) {
		elements.accountSettingsNewPassword.value = "";
		elements.accountSettingsConfirmNewPassword.value = "";
		elements.accountSettingsCurrentPassword.value = "";
		if (result.verificationRequired) {
			renderAuth();
			accountBeingVerified = username ?? oldUsername;
			elements.accountVerifyEmailText.innerText = TheI18n.GetString(I18nStringKey.kAccountModal_VerifyText, email ?? oldEmail);
			elements.accountSettingsSection.style.display = "none";
			elements.accountVerifyEmailSection.style.display = "block";
			return false;
		} else if (result.sessionExpired) {
			accountModal.hide();
			localStorage.removeItem("collabvm_session_" + new URL(auth!.apiEndpoint).host);
			if (VM) closeVM();
			renderAuth();
		} else {
			accountModal.hide();
		}
	} else {
		elements.accountModalErrorText.innerHTML = result.error!;
		elements.accountModalError.style.display = "block";
	}
	return false;
});
let resetPasswordUsername;
let resetPasswordEmail;
elements.accountResetPasswordForm.addEventListener('submit', async e => {
	e.preventDefault();
	var hcaptchaToken = undefined;
	var hcaptchaID = undefined;
	if (auth!.info!.hcaptcha.required) {
		hcaptchaID = elements.accountResetPasswordCaptcha.children[0].getAttribute("data-hcaptcha-widget-id")!
		var response = hcaptcha.getResponse(hcaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		hcaptchaToken = response;
	}
	var username = elements.accountResetPasswordUsername.value;
	var email = elements.accountResetPasswordEmail.value;
	var result = await auth!.sendPasswordResetEmail(username, email, hcaptchaToken);
	if (auth!.info!.hcaptcha.required) hcaptcha.reset(hcaptchaID);
	if (result.success) {
		resetPasswordUsername = username;
		resetPasswordEmail = email;
		elements.accountResetPasswordUsername.value = "";
		elements.accountResetPasswordEmail.value = "";
		elements.accountVerifyPasswordResetText.innerText = TheI18n.GetString(I18nStringKey.kAccountModal_VerifyPasswordResetText, email);
		elements.accountResetPasswordSection.style.display = "none";
		elements.accountResetPasswordVerifySection.style.display = "block";
	} else {
		elements.accountModalErrorText.innerHTML = result.error!;
		elements.accountModalError.style.display = "block";
	}
	return false;
});
elements.accountResetPasswordVerifyForm.addEventListener('submit', async e => {
	e.preventDefault();
	var code = elements.accountResetPasswordCode.value;
	var password = elements.accountResetPasswordNewPassword.value;
	if (password !== elements.accountResetPasswordConfirmNewPassword.value) {
		elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kPasswordsMustMatch);
		elements.accountModalError.style.display = "block";
		return false;
	}
	var result = await auth!.resetPassword(resetPasswordUsername!, resetPasswordEmail!, code, password);
	if (result.success) {
		elements.accountResetPasswordCode.value = "";
		elements.accountResetPasswordNewPassword.value = "";
		elements.accountResetPasswordConfirmNewPassword.value = "";
		elements.accountModalSuccessText.innerHTML = TheI18n.GetString(I18nStringKey.kAccountModal_PasswordResetSuccess);
		elements.accountModalSuccess.style.display = "block";
		elements.accountResetPasswordVerifySection.style.display = "none";
		elements.accountLoginSection.style.display = "block";
		
	} else {
		elements.accountModalErrorText.innerHTML = result.error!;
		elements.accountModalError.style.display = "block";
	}
	return false;
});

let darkTheme = true;
function loadColorTheme(dark : boolean) {
	if (dark) {
		darkTheme = true;
		document.children[0].setAttribute("data-bs-theme", "dark");
		elements.toggleThemeBtnText.innerHTML = TheI18n.GetString(I18nStringKey.kSiteButtons_LightMode);
		elements.toggleThemeIcon.classList.remove("fa-moon");
		elements.toggleThemeIcon.classList.add("fa-sun");
	} else {
		darkTheme = false;
		document.children[0].setAttribute("data-bs-theme", "light");
		elements.toggleThemeBtnText.innerHTML = TheI18n.GetString(I18nStringKey.kSiteButtons_DarkMode);
		elements.toggleThemeIcon.classList.remove("fa-sun");
		elements.toggleThemeIcon.classList.add("fa-moon");
	}
}
elements.toggleThemeBtn.addEventListener('click', e => {
	e.preventDefault();
	loadColorTheme(!darkTheme);
	localStorage.setItem("cvm-dark-theme", darkTheme ? "1" : "0");
	return false;
});

// Public API
w.collabvm = {
	openVM: openVM,
	closeVM: closeVM,
	loadList: loadList,
	multicollab: multicollab,
	getVM: () => VM
};
// Multicollab will stay in the global scope for backwards compatibility
w.multicollab = multicollab;
// Same goes for GetAdmin
w.GetAdmin = () => {
	if (VM === null) return;
	return {
		adminInstruction: (...args: string[]) => {
			args.unshift('admin');
			VM?.send(...args);
		},
		restore: () => VM!.restore(),
		reboot: () => VM!.reboot(),
		clearQueue: () => VM!.clearQueue(),
		bypassTurn: () => VM!.bypassTurn(),
		endTurn: (username: string) => VM!.endTurn(username),
		ban: (username: string) => VM!.ban(username),
		kick: (username: string) => VM!.kick(username),
		renameUser: (oldname: string, newname: string) => VM!.renameUser(oldname, newname),
		mute: (username: string, state: number) => VM!.mute(username, state),
		getip: (username: string) => VM!.getip(username),
		qemuMonitor: (cmd: string) => {
			VM?.qemuMonitor(cmd);
			return;
		},
		globalXss: (msg: string) => VM!.xss(msg),
		forceVote: (result: boolean) => VM!.forceVote(result)
	};
};
// more backwards compatibility
w.cvmEvents = {
	on: (event: string | number, cb: (...args: any) => void) => {
		if (VM === null) return;
		VM.on('message', (...args: any) => cb(...args));
	}
};
w.VMName = null;

document.addEventListener('DOMContentLoaded', async () => {
	// Initalize the i18n system
	await TheI18n.Init();
	TheI18n.on('languageChanged', lang => {
		// Update all dynamic text
		if (VM) {
			document.title = Format('{0} - {1}', VM.getNode()!, TheI18n.GetString(I18nStringKey.kGeneric_CollabVM));
			if (turn !== -1) {
				if (turn === 0) elements.turnstatus.innerText = TheI18n.GetString(I18nStringKey.kVM_TurnTimeTimer, turnTimer);
				else elements.turnstatus.innerText = TheI18n.GetString(I18nStringKey.kVM_WaitingTurnTimer, turnTimer);
				elements.turnBtnText.innerText = TheI18n.GetString(I18nStringKey.kVMButtons_EndTurn);
			}
			else
				elements.turnBtnText.innerText = TheI18n.GetString(I18nStringKey.kVMButtons_TakeTurn);
			if (VM!.getVoteStatus())
			elements.voteTimeText.innerText = TheI18n.GetString(I18nStringKey.kVM_VoteForResetTimer, voteTimer);

		}
		else {
			document.title = TheI18n.GetString(I18nStringKey.kGeneric_CollabVM);
		}
		if (!auth || !auth.account) elements.accountDropdownUsername.innerText = TheI18n.GetString(I18nStringKey.kNotLoggedIn);
		if (darkTheme) elements.toggleThemeBtnText.innerHTML = TheI18n.GetString(I18nStringKey.kSiteButtons_LightMode);
		else elements.toggleThemeBtnText.innerHTML = TheI18n.GetString(I18nStringKey.kSiteButtons_DarkMode);

	});
	// Load theme
	var _darktheme : boolean;
	// Check if dark theme is set in local storage
	if (localStorage.getItem("cvm-dark-theme") !== null)
		loadColorTheme(localStorage.getItem("cvm-dark-theme") === "1");
	// Otherwise, try to detect the system theme
	else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
		loadColorTheme(true);
	else
		loadColorTheme(false);
	// Initialize authentication if enabled
	if (Config.Auth.Enabled) {
		auth = new AuthManager(Config.Auth.APIEndpoint);
		renderAuth();
	}

	document.title = TheI18n.GetString(I18nStringKey.kGeneric_CollabVM);

	// Load all VMs
	loadList();

	// Welcome modal
	let welcomeModal = new bootstrap.Modal(document.getElementById('welcomeModal') as HTMLDivElement);
	let noWelcomeModal = window.localStorage.getItem('no-welcome-modal');
	if (noWelcomeModal !== '1') {
		let welcomeModalDismissBtn = document.getElementById('welcomeModalDismiss') as HTMLButtonElement;
		welcomeModalDismissBtn.addEventListener('click', () => {
			window.localStorage.setItem('no-welcome-modal', '1');
		});
		welcomeModalDismissBtn.disabled = true;
		welcomeModal.show();
		setTimeout(() => {
			welcomeModalDismissBtn.disabled = false;
		}, 5000);
	}
	elements.rulesBtn.addEventListener('click', e => {
		if (TheI18n.CurrentLanguage() !== "en-us") {
			e.preventDefault();
			welcomeModal.show();
		}
	});
});
