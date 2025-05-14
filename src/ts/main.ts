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
import { I18nStringKey, TheI18n } from './i18n.js';
import { Format } from './format.js';
import AuthManager from './AuthManager.js';
import dayjs from 'dayjs';
import * as dompurify from 'dompurify';
import { elements } from './dom';
import { enableOSK } from './osk';
const _eval = window.eval;

// Elements
const w = window as any;

let auth : AuthManager|null = null;

let expectedClose = false;
let turn = -1;
// Listed VMs
const vms: VM[] = [];
const cards: HTMLDivElement[] = [];
const users: {
	user: User;
	usernameElement: HTMLSpanElement;
	flagElement: HTMLSpanElement;
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
export let VM: CollabVMClient | null = null;

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
	VM!.on('flag', () => flag());
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
	elements.ghostTurnBtn.style.display = 'none';
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
				_eval(curr.text);
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
	let flagSpan = document.createElement('span');
	let usernameSpan = document.createElement('span');
	flagSpan.classList.add("userlist-flag");
	usernameSpan.classList.add("userlist-username");
	td.appendChild(flagSpan);
	if (user.countryCode !== null) {
		flagSpan.innerHTML = getFlagEmoji(user.countryCode);
		flagSpan.title = TheI18n.getCountryName(user.countryCode);
	};
	td.appendChild(usernameSpan);
	usernameSpan.innerText = user.username;
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
	let u = { user: user, element: tr, usernameElement: usernameSpan, flagElement: flagSpan };
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

function getFlagEmoji(countryCode: string) {
	if (countryCode.length !== 2) throw new Error('Invalid country code');
	return String.fromCodePoint(...countryCode.toUpperCase().split('').map(char =>  127397 + char.charCodeAt(0)));
}

function flag() {
	for (let user of users.filter(u => u.user.countryCode !== null)) {
		user.flagElement.innerHTML = getFlagEmoji(user.user.countryCode!);
		user.flagElement.title = TheI18n.getCountryName(user.user.countryCode!);
	}
}

function userRenamed(oldname: string, newname: string, selfrename: boolean) {
	let user = users.find((u) => u.user.username === newname);
	if (user) {
		user.usernameElement.innerHTML = newname;
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
	let oldname = w.username.nodeName === undefined ? w.username : w.username.innerText;
	let newname = prompt(TheI18n.GetString(I18nStringKey.kVMPrompts_EnterNewUsernamePrompt), oldname);
	if (newname === oldname) return;
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
		elements.ghostTurnBtn.style.display = 'inline-block';
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


elements.ghostTurnBtn.addEventListener('click', () => {
	w.collabvm.ghostTurn = !w.collabvm.ghostTurn;
	if (w.collabvm.ghostTurn)
		elements.ghostTurnBtnText.innerText = TheI18n.GetString(I18nStringKey.kAdminVMButtons_GhostTurnOn);
	else
		elements.ghostTurnBtnText.innerText = TheI18n.GetString(I18nStringKey.kAdminVMButtons_GhostTurnOff);
});

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
	
	for (let element of document.querySelectorAll("[id^=accountRegisterCaptcha-], [id^=accountLoginCaptcha-], [id^=accountResetPasswordCaptcha-]")) {
		hcaptcha.remove((element as HTMLElement).parentElement!.getAttribute("data-hcaptcha-widget-id")!);
		element.remove();
	}

	for (let element of document.querySelectorAll("[id^=accountRegisterTurnstile-], [id^=accountLoginTurnstile-], [id^=accountResetPasswordTurnstile-]")) {
		turnstile.remove((element as HTMLElement).parentElement!.getAttribute("data-turnstile-widget-id")!);
		element.remove();
	}

	for (let element of document.querySelectorAll("[id^=accountRegisterRecaptcha-], [id^=accountLoginRecaptcha-], [id^=accountResetPasswordRecaptcha-]")) {
		grecaptcha.reset(parseInt((element as HTMLElement).parentElement!.getAttribute("data-recaptcha-widget-id")!));
		element.remove();
	}

	if (auth!.info!.hcaptcha?.required) {
		const hconfig = { sitekey: auth!.info!.hcaptcha.siteKey! };
	
		let renderHcaptcha = () => {
			let uuid = Math.random().toString(36).substring(7);

			let accountRegisterCaptcha = document.createElement("div");
			accountRegisterCaptcha.id = `accountRegisterCaptcha-${uuid}`;
			elements.accountRegisterCaptchaContainer.appendChild(accountRegisterCaptcha);

			let accountLoginCaptcha = document.createElement("div");
			accountLoginCaptcha.id = `accountLoginCaptcha-${uuid}`;
			elements.accountLoginCaptchaContainer.appendChild(accountLoginCaptcha);

			let accountResetPasswordCaptcha = document.createElement("div");
			accountResetPasswordCaptcha.id = `accountResetPasswordCaptcha-${uuid}`;
			elements.accountResetPasswordCaptchaContainer.appendChild(accountResetPasswordCaptcha);

			const hCaptchaRegisterWidgetId = hcaptcha.render(accountRegisterCaptcha, hconfig);
			const hCaptchaLoginWidgetId = hcaptcha.render(accountLoginCaptcha, hconfig);
			const hCaptchaResetPasswordWidgetId = hcaptcha.render(accountResetPasswordCaptcha, hconfig);

			elements.accountRegisterCaptchaContainer.setAttribute("data-hcaptcha-widget-id", hCaptchaRegisterWidgetId!);
			elements.accountLoginCaptchaContainer.setAttribute("data-hcaptcha-widget-id", hCaptchaLoginWidgetId!);
			elements.accountResetPasswordCaptchaContainer.setAttribute("data-hcaptcha-widget-id", hCaptchaResetPasswordWidgetId!);
		};
	
		if (typeof hcaptcha === "undefined") {
			let script = document.createElement("script");
			script.src = "https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off&onload=hCaptchaLoad";
			(window as any).hCaptchaLoad = renderHcaptcha;
			document.head.appendChild(script);
		} else {
			renderHcaptcha();
		}
	}
	
	if (auth!.info?.turnstile?.required) {
		const turnstileConfig = { sitekey: auth!.info!.turnstile.siteKey! };
	
		let renderTurnstile = () => {
			let uuid = Math.random().toString(36).substring(7);

			let accountRegisterTurnstile = document.createElement("div");
			accountRegisterTurnstile.id = `accountRegisterTurnstile-${uuid}`;
			elements.accountRegisterTurnstileContainer.appendChild(accountRegisterTurnstile);

			let accountLoginTurnstile = document.createElement("div");
			accountLoginTurnstile.id = `accountLoginTurnstile-${uuid}`;
			elements.accountLoginTurnstileContainer.appendChild(accountLoginTurnstile);

			let accountResetPasswordTurnstile = document.createElement("div");
			accountResetPasswordTurnstile.id = `accountResetPasswordTurnstile-${uuid}`;
			elements.accountResetPasswordTurnstileContainer.appendChild(accountResetPasswordTurnstile);

			const turnstileRegisterWidgetId = turnstile.render(accountRegisterTurnstile, turnstileConfig);
			const turnstileLoginWidgetId = turnstile.render(accountLoginTurnstile, turnstileConfig);
			const turnstileResetPasswordWidgetId = turnstile.render(accountResetPasswordTurnstile, turnstileConfig);

			elements.accountRegisterTurnstileContainer.setAttribute("data-turnstile-widget-id", turnstileRegisterWidgetId!);
			elements.accountLoginTurnstileContainer.setAttribute("data-turnstile-widget-id", turnstileLoginWidgetId!);
			elements.accountResetPasswordTurnstileContainer.setAttribute("data-turnstile-widget-id", turnstileResetPasswordWidgetId!);
		};
	
		if (typeof turnstile === "undefined") {
			let script = document.createElement("script");
			script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=turnstileLoad";
			(window as any).turnstileLoad = renderTurnstile;
			document.head.appendChild(script);
		} else {
			renderTurnstile();
		}
	}
	
	if (auth!.info?.recaptcha?.required) {
		const recaptchaConfig = { sitekey: auth!.info!.recaptcha.siteKey! };
	
		let renderRecaptcha = () => {
			let uuid = Math.random().toString(36).substring(7);

			let accountRegisterRecaptcha = document.createElement("div");
			accountRegisterRecaptcha.id = `accountRegisterRecaptcha-${uuid}`;
			elements.accountRegisterRecaptchaContainer.appendChild(accountRegisterRecaptcha);

			let accountLoginRecaptcha = document.createElement("div");
			accountLoginRecaptcha.id = `accountLoginRecaptcha-${uuid}`;
			elements.accountLoginRecaptchaContainer.appendChild(accountLoginRecaptcha);

			let accountResetPasswordRecaptcha = document.createElement("div");
			accountResetPasswordRecaptcha.id = `accountResetPasswordRecaptcha-${uuid}`;
			elements.accountResetPasswordRecaptchaContainer.appendChild(accountResetPasswordRecaptcha);

			const RecaptchaRegisterWidgetId = grecaptcha.render(accountRegisterRecaptcha, recaptchaConfig);
			const RecaptchaLoginWidgetId = grecaptcha.render(accountLoginRecaptcha, recaptchaConfig);
			const RecaptchaResetPasswordWidgetId = grecaptcha.render(accountResetPasswordRecaptcha, recaptchaConfig);
	
			elements.accountRegisterRecaptchaContainer.setAttribute("data-recaptcha-widget-id", RecaptchaRegisterWidgetId!.toString());
			elements.accountLoginRecaptchaContainer.setAttribute("data-recaptcha-widget-id", RecaptchaLoginWidgetId!.toString());
			elements.accountResetPasswordRecaptchaContainer.setAttribute("data-recaptcha-widget-id", RecaptchaResetPasswordWidgetId!.toString());
		};
	
		if (typeof grecaptcha === "undefined") {
			let script = document.createElement("script");
			script.src = "https://www.google.com/recaptcha/api.js?render=explicit&onload=recaptchaLoad";
			(window as any).recaptchaLoad = renderRecaptcha;
			document.head.appendChild(script);
		} else {
			grecaptcha.ready(renderRecaptcha);
		}
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
	if (auth!.info!.hcaptcha?.required) {
		hcaptchaID = elements.accountLoginCaptchaContainer.getAttribute("data-hcaptcha-widget-id")!
		var response = hcaptcha.getResponse(hcaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		hcaptchaToken = response;
	}

	var turnstileToken = undefined;
	var turnstileID = undefined;

	if (auth!.info!.turnstile?.required) {
		turnstileID = elements.accountLoginTurnstileContainer.getAttribute("data-turnstile-widget-id")!
		var response: string = turnstile.getResponse(turnstileID) || "";
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		turnstileToken = response;
	}

	var recaptchaToken = undefined;
	var recaptchaID = undefined;

	if (auth!.info!.recaptcha?.required) {
		recaptchaID = parseInt(elements.accountLoginRecaptchaContainer.getAttribute("data-recaptcha-widget-id")!)
		var response = grecaptcha.getResponse(recaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		recaptchaToken = response;
	}

	var username = elements.accountLoginUsername.value;
	var password = elements.accountLoginPassword.value;
	var result = await auth!.login(username, password, hcaptchaToken, turnstileToken, recaptchaToken);
	if (auth!.info!.hcaptcha?.required) hcaptcha.reset(hcaptchaID);
	if (auth!.info!.turnstile?.required) turnstile.reset(turnstileID);
	if (auth!.info!.recaptcha?.required) grecaptcha.reset(recaptchaID);
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
	if (auth!.info!.hcaptcha?.required) {
		hcaptchaID = elements.accountRegisterCaptchaContainer.getAttribute("data-hcaptcha-widget-id")!
		var response = hcaptcha.getResponse(hcaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		hcaptchaToken = response;
	}

	var turnstileToken = undefined;
	var turnstileID = undefined;

	if (auth!.info!.turnstile?.required) {
		turnstileID = elements.accountRegisterTurnstileContainer.getAttribute("data-turnstile-widget-id")!
		var response: string = turnstile.getResponse(turnstileID) || "";
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		turnstileToken = response;
	}

	var recaptchaToken = undefined;
	var recaptchaID = undefined;

	if (auth!.info!.recaptcha?.required) {
		recaptchaID = parseInt(elements.accountRegisterRecaptchaContainer.getAttribute("data-recaptcha-widget-id")!)
		var response = grecaptcha.getResponse(recaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		recaptchaToken = response;
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
	var result = await auth!.register(username, password, email, dob, hcaptchaToken, turnstileToken, recaptchaToken);
	if (auth!.info!.hcaptcha?.required) hcaptcha.reset(hcaptchaID);
	if (auth!.info!.turnstile?.required) turnstile.reset(turnstileID);
	if (auth!.info!.recaptcha?.required) grecaptcha.reset(recaptchaID);
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
	localStorage.setItem("collabvm-hide-flag", JSON.stringify(elements.hideFlagCheckbox.checked));
	if (!password && !email && !username) {
		accountModal.hide();
		return false
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
	if (auth!.info!.hcaptcha?.required) {
		hcaptchaID = elements.accountResetPasswordCaptchaContainer.getAttribute("data-hcaptcha-widget-id")!
		var response = hcaptcha.getResponse(hcaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		hcaptchaToken = response;
	}

	var turnstileToken = undefined;
	var turnstileID = undefined;

	if (auth!.info!.turnstile?.required) {
		turnstileID = elements.accountResetPasswordTurnstileContainer.getAttribute("data-turnstile-widget-id")!
		var response: string = turnstile.getResponse(turnstileID) || "";
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		turnstileToken = response;
	}

	var recaptchaToken = undefined;
	var recaptchaID = undefined;

	if (auth!.info!.recaptcha?.required) {
		recaptchaID = parseInt(elements.accountResetPasswordRecaptchaContainer.getAttribute("data-recaptcha-widget-id")!)
		var response = grecaptcha.getResponse(recaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		recaptchaToken = response;
	}

	var username = elements.accountResetPasswordUsername.value;
	var email = elements.accountResetPasswordEmail.value;
	var result = await auth!.sendPasswordResetEmail(username, email, hcaptchaToken, turnstileToken, recaptchaToken);
	if (auth!.info!.hcaptcha?.required) hcaptcha.reset(hcaptchaID);
	if (auth!.info!.turnstile?.required) turnstile.reset(turnstileID);
	if (auth!.info!.recaptcha?.required) grecaptcha.reset(recaptchaID);
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
	getVM: () => VM,
	ghostTurn: false,
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

		if (w.collabvm.ghostTurn)
			elements.ghostTurnBtnText.innerText = TheI18n.GetString(I18nStringKey.kAdminVMButtons_GhostTurnOn);
		else
			elements.ghostTurnBtnText.innerText = TheI18n.GetString(I18nStringKey.kAdminVMButtons_GhostTurnOff);

		for (const user of users) {
			if (user.user.countryCode !== null) {
				user.flagElement.title = TheI18n.getCountryName(user.user.countryCode);
			}
		}
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

	var hideFlag = JSON.parse(localStorage.getItem("collabvm-hide-flag")!);
	if (hideFlag === null) hideFlag = false;
	elements.hideFlagCheckbox.checked = hideFlag;

	document.title = TheI18n.GetString(I18nStringKey.kGeneric_CollabVM);

	// Load all VMs
	loadList();

	// Welcome modal
	let welcomeModal = new bootstrap.Modal(document.getElementById('welcomeModal') as HTMLDivElement);
	let noWelcomeModal = window.localStorage.getItem(Config.WelcomeModalLocalStorageKey);
	if (noWelcomeModal !== '1') {
		let welcomeModalDismissBtn = document.getElementById('welcomeModalDismiss') as HTMLButtonElement;
		welcomeModalDismissBtn.addEventListener('click', () => {
			window.localStorage.setItem(Config.WelcomeModalLocalStorageKey, '1');
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
