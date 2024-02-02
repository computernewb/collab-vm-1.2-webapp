import {createNanoEvents } from "nanoevents";
import * as Guacutils from './Guacutils.js';
import VM from "./VM.js";
import { User } from "./User.js";
import { Rank } from "./Permissions.js";
import TurnStatus from "./TurnStatus.js";
import Mouse from "./mouse.js";
import GetKeysym from '../keyboard.js';

export default class CollabVMClient {
    // Fields
    private socket : WebSocket;
    canvas : HTMLCanvasElement;
    private ctx : CanvasRenderingContext2D;
    private url : string;
    private connectedToVM : boolean = false;
    private users : User[] = [];
    private username : string | null = null;
    private mouse : Mouse = new Mouse();
    private rank : Rank = Rank.Unregistered;
    // events that are used internally and not exposed
    private emitter;
    // public events
    private publicEmitter;

    constructor(url : string) {
        // Save the URL
        this.url = url;
        // Create the events
        this.emitter = createNanoEvents();
        this.publicEmitter = createNanoEvents();
        // Create the canvas
        this.canvas = document.createElement('canvas');
        // Set tab index so it can be focused
        this.canvas.tabIndex = -1;
        // Get the 2D context
        this.ctx = this.canvas.getContext('2d')!;
        // Bind canvas click
        this.canvas.addEventListener('click', e => {
            if (this.users.find(u => u.username === this.username)?.turn === -1)
                this.turn(true);
        });
        // Bind keyboard and mouse
        this.canvas.addEventListener('mousedown', (e : MouseEvent) => {
            if (this.users.find(u => u.username === this.username)?.turn === -1 && this.rank !== Rank.Admin) return;
            this.mouse.processEvent(e, true);
            this.sendmouse(this.mouse.x, this.mouse.y, this.mouse.makeMask());
        }, {
            capture: true
        });
        this.canvas.addEventListener('mouseup', (e : MouseEvent) => {
            if (this.users.find(u => u.username === this.username)?.turn === -1 && this.rank !== Rank.Admin) return;
            this.mouse.processEvent(e, false);
            this.sendmouse(this.mouse.x, this.mouse.y, this.mouse.makeMask());
        }, {
            capture: true
        });
        this.canvas.addEventListener('mousemove', (e : MouseEvent) => {
            if (this.users.find(u => u.username === this.username)?.turn === -1 && this.rank !== Rank.Admin) return;
            this.mouse.processEvent(e, null);
            this.sendmouse(this.mouse.x, this.mouse.y, this.mouse.makeMask());
        }, {
            capture: true
        });
        this.canvas.addEventListener('keydown', (e : KeyboardEvent) => {
            if (this.users.find(u => u.username === this.username)?.turn === -1 && this.rank !== Rank.Admin) return;
            var keysym = GetKeysym(e.keyCode, e.key, e.location);
            if (keysym === null) return;
            this.key(keysym, true);
        }, {
            capture: true
        });
        this.canvas.addEventListener('keyup', (e : KeyboardEvent) => {
            if (this.users.find(u => u.username === this.username)?.turn === -1 && this.rank !== Rank.Admin) return;
            var keysym = GetKeysym(e.keyCode, e.key, e.location);
            if (keysym === null) return;
            this.key(keysym, false);
        }, {
            capture: true
        });
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        // Create the WebSocket
        this.socket = new WebSocket(url, "guacamole");
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
    private onMessage(event : MessageEvent) {
        var msgArr : string[];
        try {
            msgArr = Guacutils.decode(event.data);
        } catch (e) {
            console.error(`Server sent invalid message (${e})`);
            return;
        }
        switch (msgArr[0]) {
            case "nop": {
                // Send a NOP back
                this.send("nop");
                break;
            }
            case "list": {
                // pass msgarr to the emitter for processing by list()
                this.emitter.emit('list', msgArr.slice(1));
                break;
            }
            case "connect": {
                this.connectedToVM = msgArr[1] === "1";
                this.emitter.emit('connect', this.connectedToVM);
                break;
            }
            case "size": {
                if (msgArr[1] !== "0") return;
                this.canvas.width = parseInt(msgArr[2]);
                this.canvas.height = parseInt(msgArr[3]);
                break;
            }
            case "png": {
                // Despite the opcode name, this is actually JPEG, because old versions of the server used PNG and yknow backwards compatibility
                var img = new Image();
                img.addEventListener('load', () => {
                    this.ctx.drawImage(img, parseInt(msgArr[3]), parseInt(msgArr[4]));
                });
                img.src = "data:image/jpeg;base64," + msgArr[5];
                break;
            }
            case "chat": {
                for (var i = 1; i < msgArr.length; i += 2) {
                    this.publicEmitter.emit('chat', msgArr[i], msgArr[i + 1]);
                }
                break;
            }
            case "adduser": {
                for (var i = 2; i < msgArr.length; i += 2) {
                    var user = new User(msgArr[i], parseInt(msgArr[i + 1]) as Rank);
                    this.users.push(user);
                    this.publicEmitter.emit('adduser', user);
                }
                break;
            }
            case "remuser": {
                for (var i = 2; i < msgArr.length; i++) {
                    var _user = this.users.find(u => u.username === msgArr[i]);
                    if (_user === undefined) continue;
                    this.users.splice(this.users.indexOf(_user), 1);
                    this.publicEmitter.emit('remuser', _user);
                }
            }
            case "rename": {
                var selfrename = false;
                var oldusername : string | null = null;
                // We've been renamed
                if (msgArr[1] === "0") {
                    selfrename = true;
                    oldusername = this.username;
                    // msgArr[2] is the status of the rename
                    // Anything other than 0 is an error, however the server will still rename us to a guest name
                    switch (msgArr[2]) {
                        case "1":
                            // The username we wanted was taken
                            this.publicEmitter.emit('renamestatus', 'taken');
                            break;
                        case "2":
                            // The username we wanted was invalid
                            this.publicEmitter.emit('renamestatus', 'invalid');
                            break;
                        case "3":
                            // The username we wanted is blacklisted
                            this.publicEmitter.emit('renamestatus', 'blacklisted');
                            break;
                    }
                    this.username = msgArr[3];
                }
                else oldusername = msgArr[2];
                var _user = this.users.find(u => u.username === oldusername);
                if (_user) {
                    _user.username = msgArr[3];
                }
                this.publicEmitter.emit('rename', oldusername, msgArr[3], selfrename);
                break;
            }
            case "turn": {
                // Reset all turn data
                for (var user of this.users) user.turn = -1;
                var queuedUsers = parseInt(msgArr[2]);
                if (queuedUsers === 0) {
                    this.publicEmitter.emit('turn', {
                        user: null,
                        queue: [],
                        turnTime: null,
                        queueTime: null,
                    } as TurnStatus);
                    return;
                }
                var currentTurn = this.users.find(u => u.username === msgArr[3])!;
                currentTurn.turn = 0;
                var queue : User[] = [];
                if (queuedUsers > 1) {
                    for (var i = 1; i < queuedUsers; i++) {
                        var user = this.users.find(u => u.username === msgArr[i+3])!;
                        queue.push(user);
                        user.turn = i;
                    }
                }
                this.publicEmitter.emit('turn', {
                    user: currentTurn,
                    queue: queue,
                    turnTime: currentTurn.username === this.username ? parseInt(msgArr[1]) : null,
                    queueTime: queue.some(u => u.username === this.username) ? parseInt(msgArr[msgArr.length - 1]) : null,
                } as TurnStatus)
                break;
            }
        }
    }

    // Sends a message to the server
    send(...args : string[]) {
        this.socket.send(Guacutils.encode(...args));
    }

    // Get a list of all VMs
    list() : Promise<VM[]> {
        return new Promise((res, rej) => {
            var u = this.emitter.on('list', (list : string[]) => {
                u();
                var vms : VM[] = [];
                for (var i = 0; i < list.length; i += 3) {
                    var th = new Image();
                    th.src = "data:image/jpeg;base64," + list[i + 2];
                    vms.push({
                        url: this.url,
                        id: list[i],
                        displayName: list[i + 1],
                        thumbnail: th,
                    });
                }
                res(vms);
            });
            this.send("list");
        });
    }

    // Connect to a node
    connect(id : string, username : string | null = null) : Promise<boolean> {
        return new Promise(res => {
            var u = this.emitter.on('connect', (success : boolean) => {
                u();
                res(success);
            });
            if (username === null) this.send("rename");
            else this.send("rename", username);
            this.send("connect", id);
        })
    }

    // Close the connection
    close() {
        this.connectedToVM = false;
        if (this.socket.readyState === WebSocket.OPEN) this.socket.close();
    }

    // Get users
    getUsers() : User[] {
        // Return a copy of the array
        return this.users.slice();
    }

    // Send a chat message
    chat(message : string) {
        this.send("chat", message);
    }

    // Rename
    rename(username : string | null = null) {
        if (username) this.send("rename", username);
        else this.send("rename");
    }

    // Take or drop turn
    turn(taketurn : boolean) {
        this.send("turn", taketurn ? "1" : "0");
    }

    // Send mouse instruction
    sendmouse(x : number, y : number, mask : number) {
        this.send("mouse", x.toString(), y.toString(), mask.toString());
    }

    // Send key
    key(keysym : number, down : boolean) {
        this.send("key", keysym.toString(), down ? "1" : "0");
    }

    on = (event : string | number, cb: (...args: any) => void) => this.publicEmitter.on(event, cb);
}