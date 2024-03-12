import { createNanoEvents, Emitter, DefaultEvents } from 'nanoevents';
import * as Guacutils from './Guacutils.js';
import VM from './VM.js';
import { User } from './User.js';
import { AdminOpcode, Permissions, Rank } from './Permissions.js';
import TurnStatus from './TurnStatus.js';
import Mouse from './mouse.js';
import GetKeysym from '../keyboard.js';
import VoteStatus from './VoteStatus.js';
import MuteState from './MuteState.js';

// TODO: `Object` has a toString(), but we should probably gate that off
/// Interface for things that can be turned into strings
interface ToStringable {
	toString(): string;
}

/// A type for strings, or things that can (in a valid manner) be turned into strings
type StringLike = string | ToStringable;

export interface CollabVMClientEvents {
	open: () => void;
	close: () => void;

	message: (...args: string[]) => void;

	// Protocol stuff
	chat: (username: string, message: string) => void;

	adduser: (user: User) => void;
	remuser: (user: User) => void;

	renamestatus: (status: 'taken' | 'invalid' | 'blacklisted') => void;
	turn: (status: TurnStatus) => void;

	rename: (oldUsername: string, newUsername: string, selfRename: boolean) => void;

	vote: (status: VoteStatus) => void;
	voteend: () => void;
	votecd: (coolDownTime: number) => void;

	badpw: () => void;
	login: (rank: Rank, perms: Permissions) => void;
}

// types for private emitter
interface CollabVMClientPrivateEvents {
	list: (listEntries: string[]) => void;
	connect: (connectedToVM: boolean) => void;
	ip: (username: string, ip: string) => void;
	qemu: (qemuResponse: string) => void;
}

export default class CollabVMClient {
	// Fields
	private socket: WebSocket;
	canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private url: string;
	private connectedToVM: boolean = false;
	private users: User[] = [];
	private username: string | null = null;
	private mouse: Mouse = new Mouse();
	private rank: Rank = Rank.Unregistered;
	private perms: Permissions = new Permissions(0);
	private voteStatus: VoteStatus | null = null;
	private node: string | null = null;
	// events that are used internally and not exposed
	private internalEmitter: Emitter<CollabVMClientPrivateEvents>;
	// public events
	private publicEmitter: Emitter<CollabVMClientEvents>;

	constructor(url: string) {
		// Save the URL
		this.url = url;
		// Create the events
		this.internalEmitter = createNanoEvents();
		this.publicEmitter = createNanoEvents();
		// Create the canvas
		this.canvas = document.createElement('canvas');
		// Set tab index so it can be focused
		this.canvas.tabIndex = -1;
		// Get the 2D context
		this.ctx = this.canvas.getContext('2d')!;
		// Bind canvas click
		this.canvas.addEventListener('click', (e) => {
			if (this.users.find((u) => u.username === this.username)?.turn === -1) this.turn(true);
		});

		// Bind keyboard and mouse
		this.canvas.addEventListener(
			'mousedown',
			(e: MouseEvent) => {
				if (this.users.find((u) => u.username === this.username)?.turn === -1 && this.rank !== Rank.Admin) return;
				this.mouse.initFromMouseEvent(e);
				this.sendmouse(this.mouse.x, this.mouse.y, this.mouse.makeMask());
			},
			{
				capture: true
			}
		);

		this.canvas.addEventListener(
			'mouseup',
			(e: MouseEvent) => {
				if (this.users.find((u) => u.username === this.username)?.turn === -1 && this.rank !== Rank.Admin) return;
				this.mouse.initFromMouseEvent(e);
				this.sendmouse(this.mouse.x, this.mouse.y, this.mouse.makeMask());
			},
			{
				capture: true
			}
		);

		this.canvas.addEventListener(
			'mousemove',
			(e: MouseEvent) => {
				if (this.users.find((u) => u.username === this.username)?.turn === -1 && this.rank !== Rank.Admin) return;
				this.mouse.initFromMouseEvent(e);
				this.sendmouse(this.mouse.x, this.mouse.y, this.mouse.makeMask());
			},
			{
				capture: true
			}
		);

		this.canvas.addEventListener(
			'keydown',
			(e: KeyboardEvent) => {
				e.preventDefault();
				if (this.users.find((u) => u.username === this.username)?.turn === -1 && this.rank !== Rank.Admin) return;
				var keysym = GetKeysym(e.keyCode, e.key, e.location);
				if (keysym === null) return;
				this.key(keysym, true);
			},
			{
				capture: true
			}
		);

		this.canvas.addEventListener(
			'keyup',
			(e: KeyboardEvent) => {
				e.preventDefault();
				if (this.users.find((u) => u.username === this.username)?.turn === -1 && this.rank !== Rank.Admin) return;
				var keysym = GetKeysym(e.keyCode, e.key, e.location);
				if (keysym === null) return;
				this.key(keysym, false);
			},
			{
				capture: true
			}
		);

		this.canvas.addEventListener(
			'wheel',
			(ev: WheelEvent) => {
				ev.preventDefault();
				if (this.users.find((u) => u.username === this.username)?.turn === -1 && this.rank !== Rank.Admin) return;
				this.mouse.initFromWheelEvent(ev);

				this.sendmouse(this.mouse.x, this.mouse.y, this.mouse.makeMask());

				// this is a very, very ugly hack but it seems to work so /shrug
				if (this.mouse.scrollUp) this.mouse.scrollUp = false;
				else if (this.mouse.scrollDown) this.mouse.scrollDown = false;

				this.sendmouse(this.mouse.x, this.mouse.y, this.mouse.makeMask());
			},
			{
				capture: true
			}
		);

		this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
		// Create the WebSocket
		this.socket = new WebSocket(url, 'guacamole');
		// Add the event listeners
		this.socket.addEventListener('open', () => this.onOpen());
		this.socket.addEventListener('message', (event) => this.onMessage(event));
		this.socket.addEventListener('close', () => this.publicEmitter.emit('close'));
	}

	// Fires when the WebSocket connection is opened
	private onOpen() {
		this.publicEmitter.emit('open');
	}

	// Fires on WebSocket message
	private onMessage(event: MessageEvent) {
		var msgArr: string[];
		try {
			msgArr = Guacutils.decode(event.data);
		} catch (e) {
			console.error(`Server sent invalid message (${e})`);
			return;
		}
		this.publicEmitter.emit('message', ...msgArr);
		switch (msgArr[0]) {
			case 'nop': {
				// Send a NOP back
				this.send('nop');
				break;
			}
			case 'list': {
				// pass msgarr to the emitter for processing by list()
				this.internalEmitter.emit('list', msgArr.slice(1));
				break;
			}
			case 'connect': {
				this.connectedToVM = msgArr[1] === '1';
				this.internalEmitter.emit('connect', this.connectedToVM);
				break;
			}
			case 'size': {
				if (msgArr[1] !== '0') return;
				this.canvas.width = parseInt(msgArr[2]);
				this.canvas.height = parseInt(msgArr[3]);
				break;
			}
			case 'png': {
				// Despite the opcode name, this is actually JPEG, because old versions of the server used PNG and yknow backwards compatibility
				var img = new Image();
				img.addEventListener('load', () => {
					this.ctx.drawImage(img, parseInt(msgArr[3]), parseInt(msgArr[4]));
				});
				img.src = 'data:image/jpeg;base64,' + msgArr[5];
				break;
			}
			case 'chat': {
				for (var i = 1; i < msgArr.length; i += 2) {
					this.publicEmitter.emit('chat', msgArr[i], msgArr[i + 1]);
				}
				break;
			}
			case 'adduser': {
				for (var i = 2; i < msgArr.length; i += 2) {
					var _user = this.users.find((u) => u.username === msgArr[i]);
					if (_user !== undefined) {
						_user.rank = parseInt(msgArr[i + 1]);
					} else {
						_user = new User(msgArr[i], parseInt(msgArr[i + 1]));
						this.users.push(_user);
					}
					this.publicEmitter.emit('adduser', _user);
				}
				break;
			}
			case 'remuser': {
				for (var i = 2; i < msgArr.length; i++) {
					var _user = this.users.find((u) => u.username === msgArr[i]);
					if (_user === undefined) continue;
					this.users.splice(this.users.indexOf(_user), 1);
					this.publicEmitter.emit('remuser', _user);
				}
			}
			case 'rename': {
				var selfrename = false;
				var oldusername: string | null = null;
				// We've been renamed
				if (msgArr[1] === '0') {
					selfrename = true;
					oldusername = this.username;
					// msgArr[2] is the status of the rename
					// Anything other than 0 is an error, however the server will still rename us to a guest name
					switch (msgArr[2]) {
						case '1':
							// The username we wanted was taken
							this.publicEmitter.emit('renamestatus', 'taken');
							break;
						case '2':
							// The username we wanted was invalid
							this.publicEmitter.emit('renamestatus', 'invalid');
							break;
						case '3':
							// The username we wanted is blacklisted
							this.publicEmitter.emit('renamestatus', 'blacklisted');
							break;
					}
					this.username = msgArr[3];
				} else oldusername = msgArr[2];
				var _user = this.users.find((u) => u.username === oldusername);
				if (_user) {
					_user.username = msgArr[3];
				}
				this.publicEmitter.emit('rename', oldusername!, msgArr[3], selfrename);
				break;
			}
			case 'turn': {
				// Reset all turn data
				for (var user of this.users) user.turn = -1;
				var queuedUsers = parseInt(msgArr[2]);
				if (queuedUsers === 0) {
					this.publicEmitter.emit('turn', {
						user: null,
						queue: [],
						turnTime: null,
						queueTime: null
					});
					return;
				}
				var currentTurn = this.users.find((u) => u.username === msgArr[3])!;
				currentTurn.turn = 0;
				var queue: User[] = [];
				if (queuedUsers > 1) {
					for (var i = 1; i < queuedUsers; i++) {
						var user = this.users.find((u) => u.username === msgArr[i + 3])!;
						queue.push(user);
						user.turn = i;
					}
				}
				this.publicEmitter.emit('turn', {
					user: currentTurn,
					queue: queue,
					turnTime: currentTurn.username === this.username ? parseInt(msgArr[1]) : null,
					queueTime: queue.some((u) => u.username === this.username) ? parseInt(msgArr[msgArr.length - 1]) : null
				});
				break;
			}
			case 'vote': {
				switch (msgArr[1]) {
					case '0':
					// Vote started
					case '1':
						// Vote updated
						var timeToEnd = parseInt(msgArr[2]);
						var yesVotes = parseInt(msgArr[3]);
						var noVotes = parseInt(msgArr[4]);
						// Some server implementations dont send data for status 0, and some do
						if (Number.isNaN(timeToEnd) || Number.isNaN(yesVotes) || Number.isNaN(noVotes)) return;
						this.voteStatus = {
							timeToEnd: timeToEnd,
							yesVotes: yesVotes,
							noVotes: noVotes
						};
						this.publicEmitter.emit('vote', this.voteStatus);
						break;
					case '2':
						// Vote ended
						this.voteStatus = null;
						this.publicEmitter.emit('voteend');
						break;
					case '3':
						// Cooldown
						this.publicEmitter.emit('votecd', parseInt(msgArr[2]));
						break;
				}
			}
			case 'admin': {
				switch (msgArr[1]) {
					case '0': {
						// Login
						switch (msgArr[2]) {
							case '0':
								this.publicEmitter.emit('badpw');
								return;
							case '1':
								this.perms = new Permissions(65535);
								this.rank = Rank.Admin;
								break;
							case '3':
								this.perms = new Permissions(parseInt(msgArr[3]));
								this.rank = Rank.Moderator;
								break;
						}
						this.publicEmitter.emit('login', this.rank, this.perms);
						break;
					}
					case '19': {
						// IP
						this.internalEmitter.emit('ip', msgArr[2], msgArr[3]);
						break;
					}
					case '2': {
						// QEMU
						this.internalEmitter.emit('qemu', msgArr[2]);
						break;
					}
				}
			}
		}
	}

	// Sends a message to the server
	send(...args: StringLike[]) {
		let guacElements = [...args].map((el) => {
			// This catches cases where the thing already is a string
			if (typeof el == 'string') return el as string;
			return el.toString();
		});

		this.socket.send(Guacutils.encode(...guacElements));
	}

	// Get a list of all VMs
	list(): Promise<VM[]> {
		return new Promise((res, rej) => {
			var u = this.onInternal('list', (list: string[]) => {
				u();
				var vms: VM[] = [];
				for (var i = 0; i < list.length; i += 3) {
					var th = new Image();
					th.src = 'data:image/jpeg;base64,' + list[i + 2];
					vms.push({
						url: this.url,
						id: list[i],
						displayName: list[i + 1],
						thumbnail: th
					});
				}
				res(vms);
			});
			this.send('list');
		});
	}

	// Connect to a node
	connect(id: string, username: string | null = null): Promise<boolean> {
		return new Promise((res) => {
			var u = this.onInternal('connect', (success: boolean) => {
				u();
				res(success);
			});
			if (username === null) this.send('rename');
			else this.send('rename', username);
			this.send('connect', id);
			this.node = id;
		});
	}

	// Close the connection
	close() {
		this.connectedToVM = false;
		if (this.socket.readyState === WebSocket.OPEN) this.socket.close();
	}

	// Get users
	getUsers(): User[] {
		// Return a copy of the array
		return this.users.slice();
	}

	// Send a chat message
	chat(message: string) {
		this.send('chat', message);
	}

	// Rename
	rename(username: string | null = null) {
		if (username) this.send('rename', username);
		else this.send('rename');
	}

	// Take or drop turn
	turn(taketurn: boolean) {
		this.send('turn', taketurn ? '1' : '0');
	}

	// Send mouse instruction
	sendmouse(x: number, y: number, mask: number) {
		this.send('mouse', x, y, mask);
	}

	// Send key
	key(keysym: number, down: boolean) {
		this.send('key', keysym, down ? '1' : '0');
	}

	// Get vote status
	getVoteStatus(): VoteStatus | null {
		return this.voteStatus;
	}

	// Start a vote, or vote
	vote(vote: boolean) {
		this.send('vote', vote ? '1' : '0');
	}

	// Try to login using the specified password
	login(password: string) {
		this.send('admin', AdminOpcode.Login, password);
	}

	/* Admin commands */

	// Restore
	restore() {
		if (!this.node) return;
		this.send('admin', AdminOpcode.Restore, this.node!);
	}

	// Reboot
	reboot() {
		if (!this.node) return;
		this.send('admin', AdminOpcode.Reboot, this.node!);
	}

	// Clear turn queue
	clearQueue() {
		if (!this.node) return;
		this.send('admin', AdminOpcode.ClearTurns, this.node!);
	}

	// Bypass turn
	bypassTurn() {
		this.send('admin', AdminOpcode.BypassTurn);
	}

	// End turn
	endTurn(user: string) {
		this.send('admin', AdminOpcode.EndTurn, user);
	}

	// Ban
	ban(user: string) {
		this.send('admin', AdminOpcode.BanUser, user);
	}

	// Kick
	kick(user: string) {
		this.send('admin', AdminOpcode.KickUser, user);
	}

	// Rename user
	renameUser(oldname: string, newname: string) {
		this.send('admin', AdminOpcode.RenameUser, oldname, newname);
	}

	// Mute user
	mute(user: string, state: MuteState) {
		this.send('admin', AdminOpcode.MuteUser, user, state);
	}

	// Grab IP
	getip(user: string) {
		if (this.users.find((u) => u.username === user) === undefined) return false;
		return new Promise<string>((res) => {
			var u = this.onInternal('ip', (username: string, ip: string) => {
				if (username !== user) return;
				u();
				res(ip);
			});
			this.send('admin', AdminOpcode.GetIP, user);
		});
	}

	// QEMU Monitor
	qemuMonitor(cmd: string) {
		return new Promise<string>((res) => {
			var u = this.onInternal('qemu', (output) => {
				u();
				res(output);
			});
			this.send('admin', AdminOpcode.MonitorCommand, this.node!, cmd);
		});
	}

	// XSS
	xss(msg: string) {
		this.send('admin', AdminOpcode.ChatXSS, msg);
	}

	// Force vote
	forceVote(result: boolean) {
		this.send('admin', AdminOpcode.ForceVote, result ? '1' : '0');
	}

	// Toggle turns
	turns(enabled: boolean) {
		this.send('admin', AdminOpcode.ToggleTurns, enabled ? '1' : '0');
	}

	// Indefinite turn
	indefiniteTurn() {
		this.send('admin', AdminOpcode.IndefiniteTurn);
	}

	// Hide screen
	hideScreen(hidden: boolean) {
		this.send('admin', AdminOpcode.HideScreen, hidden ? '1' : '0');
	}

	private onInternal<E extends keyof CollabVMClientPrivateEvents>(event: E, callback: CollabVMClientPrivateEvents[E]) {
		return this.internalEmitter.on(event, callback);
	}

	on<E extends keyof CollabVMClientEvents>(event: E, callback: CollabVMClientEvents[E]) {
		return this.publicEmitter.on(event, callback);
	}
}
