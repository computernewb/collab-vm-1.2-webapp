import { guacutils } from "./protocol";
import { config } from "./common";
import { GetKeysym } from "./keyboard";
import { createNanoEvents } from "nanoevents";
import { makeperms } from "./permissions";
import doCaptcha from "./captcha";
import i18n from "./i18n";

// i18n
window.i18n = new i18n(navigator.language.split("-")[0]);
window.i18n.init().then(() => {
    window.i18n.replaceAllInDOM();
});

// None = -1
// Has turn = 0
// In queue = <queue position>
var turn = -1;
var perms = makeperms(0, config);
var rank = 0;
var connected = false;
const vms = [];
const users = [];
const buttons = {
    home: window.document.getElementById("homeBtn"),
    takeTurn: window.document.getElementById("takeTurnBtn"),
    changeUsername: window.document.getElementById("changeUsernameBtn"),
    voteReset: window.document.getElementById("voteResetButton"),
    screenshot: window.document.getElementById("screenshotButton"),
    // Staff
    restore: window.document.getElementById("restoreBtn"),
    reboot: window.document.getElementById("rebootBtn"),
    clearQueue: window.document.getElementById("clearQueueBtn"),
    bypassTurn: window.document.getElementById("bypassTurnBtn"),
    endTurn: window.document.getElementById("endTurnBtn"),
    qemuMonitor: window.document.getElementById("qemuMonitorBtn"),
    qemuMonitorSend: window.document.getElementById("qemuMonitorSendBtn"),
    sendChat: window.document.getElementById("sendChatBtn"),
    ctrlAltDel: window.document.getElementById("ctrlAltDelBtn"),
    forceVoteYes: window.document.getElementById("forceVoteYesBtn"),
    forceVoteNo: window.document.getElementById("forceVoteNoBtn"),
}
var hasTurn = false;
var vm;
var voteinterval;
var turninterval;
const chatsound = new Audio(config.chatSound);
// Elements
const turnstatus = window.document.getElementById("turnstatus");
const vmlist = window.document.getElementById("vmlist");
const vmview = window.document.getElementById("vmview");
const display = window.document.getElementById("display");
const displayCtx = display.getContext("2d");
const chatList = window.document.getElementById("chatList");
const userlist = window.document.getElementById("userlist");
const usernameSpan = window.document.getElementById("username");
const onlineusercount = window.document.getElementById("onlineusercount");
const chatinput = window.document.getElementById("chat-input");
const voteresetpanel = document.getElementById("voteResetPanel");
const voteyesbtn = document.getElementById("voteYesBtn");
const votenobtn = document.getElementById("voteNoBtn");
const voteyeslabel = document.getElementById("voteYesLabel");
const votenolabel = document.getElementById("voteNoLabel");
const staffbtns = document.getElementById("staffbtns");
const qemuMonitorInput = document.getElementById("qemuMonitorInput");
const qemuMonitorOutput = document.getElementById("qemuMonitorOutput");
const xssCheckbox = document.getElementById("xssCheckbox");
const xssCheckboxContainer = document.getElementById("xssCheckboxContainer");
const forceVotePanel = document.getElementById("forceVotePanel");
const voteStatusText = document.getElementById("voteStatusText");
// needed to scroll to bottom
const chatListDiv = document.querySelector(".chat-table");

let events = new Map();

function addListener(element, event, id, callback) {
  events.set(id, callback);
  element.addEventListener(event, callback, {capture: true});
}

function removeListener(element, event, id) {
  element.removeEventListener(event, events.get(id), true);
  events.delete(id);
}

class CollabVMClient {
    eventemitter = createNanoEvents();
    socket;
    node;
    #url;
    #captcha = false;
    captchaToken;
    isMainSocket;
    shouldReconnect = true;
    constructor(url, isMainSocket) {
        this.#url = url;
        this.isMainSocket = isMainSocket;
    }
    connect(hcaptchatoken) {
        this.captchaToken = hcaptchatoken;
        return new Promise((res, rej) => {
            try {
                this.socket = new WebSocket(this.#url, "guacamole");
            } catch (e) {
                rej(e);
            }
            this.socket.addEventListener('message', (e) => this.#onMessage(e));
            this.socket.addEventListener('open', () => res(true), {once: true});
            this.socket.addEventListener('close', (e) => { if(!e.wasClean) res(false); }, {once: true});
        })

    }
    #onClose() {
        cleanup();
		if(this.shouldReconnect) {
			setTimeout(async () => {
				try {
					connected = await this.connect(this.captchaToken);
				} catch {
					this.#onClose();
				}
				this.connectToVM(this.node);
			}, 2000);
		}
    }
    disconnect() {
        this.socket.send(guacutils.encode(["disconnect"]));
        this.socket.close();
    }
    getUrl() {
        return this.#url;
    }
    connectToVM(node) {
        return new Promise(async (res, rej) => {
            this.socket.addEventListener('close', () => this.#onClose());
            this.node = node;
            if (this.captchaToken !== null) {
                await new Promise((reso, reje) => {
                    var unbind = this.eventemitter.on('captcha', (result) => {
                        unbind();
                        if (result === true) {
                            reso();
                            return;
                        }
                        else {
                            reje();
                        }
                    });
                    this.socket.send(guacutils.encode(["captcha", this.captchaToken]));
                });
            }
            var savedUsername = window.localStorage.getItem("username");
            if (savedUsername === null)
                this.socket.send(guacutils.encode(["rename"]));
            else this.socket.send(guacutils.encode(["rename", savedUsername]));
            var unbind = this.eventemitter.on('connect', () => {
                unbind();
                res();
            });
            var failunbind = this.eventemitter.on('connectfail', () => {
                failunbind();
                rej();
            });
            this.socket.send(guacutils.encode(["connect", node]));
            var pass = window.localStorage.getItem("password_"+this.#url);
            if (pass)
                this.admin.login(pass);
        });
    }
    async #onMessage(event) {
        var msgArr = guacutils.decode(event.data);
        window.cvmEvents.emit(msgArr[0], msgArr.slice(1));
        switch (msgArr[0]) {
            case "nop":
                this.socket.send("3.nop;");
                break;
            case "connect":
                switch (msgArr[1]) {
                    case "0":
                        this.eventemitter.emit('connectfail');
                        break;
                    case "1":
                        this.eventemitter.emit('connect');
                        break;
                }
                break;
            case "captcha":
                switch (msgArr[1]) {
                    case "0":
                        this.#captcha = msgArr[2];
                        console.log(this.#captcha);
                        break;
                    case "1":
                        this.eventemitter.emit('captcha', true);
                        break;
                    case "2":
                        this.eventemitter.emit('captcha', false);
                }
            case "chat":
                if (!connected || !this.isMainSocket) return;
                for (var i = 1; i < msgArr.length; i += 2) {
                    chatMessage(msgArr[i], msgArr[i+1])
                }
                chatsound.play();
                chatListDiv.scrollTop = chatListDiv.scrollHeight;
                break;
            case "list":
                var list = [];
                for (var i = 1; i < msgArr.length; i+=3) {
                    list.push({
                        url: this.#url,
                        id: msgArr[i],
                        name: msgArr[i+1],
                        thumb: msgArr[i+2],
                        captcha: this.#captcha,

                    });
                }
                this.eventemitter.emit('list', list);
                break;
            case "size":
                if (!connected || msgArr[1] !== "0") return;
                display.width = msgArr[2];
                display.height = msgArr[3];
                break;
            case "png":
                if (!connected || msgArr[2] !== "0") return;
                var img = new Image(display.width, display.height);
                img.addEventListener('load', () => {
                    displayCtx.drawImage(img, msgArr[3], msgArr[4]);
                });
                img.src = "data:image/png;base64," + msgArr[5];
                break;
            case "rename":
                if (msgArr[1] === "0") {
                    switch (msgArr[2]) {
                        case "1":
                            alert("That username is already taken");
                            break;
                        case "2":
                            alert("Usernames can contain only numbers, letters, spaces, dashes, underscores, and dots, and it must be between 3 and 20 characters.");
                            break;
                        case "3":
                            alert("That username has been blacklisted.");
                            break;
                    }    
		    if (!connected || !this.isMainSocket) return;
                    var u = users.find(u => u.username === window.username);
                    if (u) {
                        u.username = msgArr[3];
                        u.element.children[0].innerHTML = msgArr[3];
                    }
                    window.username = msgArr[3];
                    usernameSpan.innerText = msgArr[3];
                    window.localStorage.setItem("username", msgArr[3]);
                    return;
                }
                var user = users.find(u => u.username == msgArr[2]);
                if (user === undefined) break;
                user.username = msgArr[3];
                user.element.children[0].innerHTML = msgArr[3];
                break;
            case "adduser":
		        if (!connected || !this.isMainSocket) return;
                for (var i = 2; i < msgArr.length; i += 2) {
                    this.addUser(msgArr[i], msgArr[i+1]);
                }
                onlineusercount.innerText = users.length;
                break;
            case "remuser":
		if (!connected || !this.isMainSocket) return;
                for (var i = 2; i < msgArr.length; i++) {
                    var user = users.find(u => u.username == msgArr[i]);
                    users.splice(users.indexOf(user), 1);
                    userlist.removeChild(user.element);
                }
                onlineusercount.innerText = users.length;
                break;

            case "turn":
                // Reset all turn data
                users.forEach((curr) => {
                    curr.turn = -1;
                    curr.element.classList = "";
                });
                buttons.takeTurn.innerHTML = `<i class=\"fa-solid fa-computer-mouse\"></i><span id="takeTurnButtonText"> ${window.i18n.get("Take Turn")}</span>`;
                turn = -1;
                if (!msgArr.includes(username))
                    turnstatus.innerText = "";
				display.className = "";
                clearInterval(turninterval);
                // Get the number of users queued for a turn
                var queuedUsers = Number(msgArr[2]);
                if (queuedUsers === 0) return;
                var currentTurnUsername = msgArr[3];
                // Get the user who has the turn and highlight them
                var currentTurnUser = users.find(u => u.username === currentTurnUsername);
                currentTurnUser.element.classList = "table-primary";
                currentTurnUser.turn = 0;
                if (currentTurnUsername === window.username) {
                    turn = 0;
                    var secs = Math.floor(parseInt(msgArr[1]) / 1000);
                    var turnUpdate = () => {
                        secs--;
                        if (secs === 0)
                            clearInterval(turninterval);
                        turnstatus.innerText = `${window.i18n.get("Turn expires in # seconds.").replace("#", secs)}`;
                    }
                    turnUpdate();
                    turninterval = setInterval(turnUpdate, 1000);
					display.className = "focused";
				}
                // Highlight all waiting users and set their status
                if (queuedUsers > 1) {
                    for (var i = 1; i < queuedUsers; i++) {
                        if (window.username === msgArr[i+3]) {
                            turn = i;
                            var secs = Math.floor(parseInt(msgArr[msgArr.length-1]) / 1000);
                            var turnUpdate = () => {
                                secs--;
                                if (secs === 0)
                                    clearInterval(turninterval);
                                turnstatus.innerText = `${window.i18n.get("Waiting for turn in # seconds.").replace("#", secs)}`;
                            }
                            turninterval = setInterval(turnUpdate, 1000);
                            turnUpdate();
							display.className = "waiting";
                        };
                        var user = users.find(u => u.username === msgArr[i+3]);
                        user.turn = i;
                        user.element.classList = "table-warning";
                    }
                }
                if (turn === -1) {
                    buttons.takeTurn.innerHTML = `<i class=\"fa-solid fa-computer-mouse\"></i><span id="takeTurnButtonText"> ${window.i18n.get("Take Turn")}</span>`;
                } else {
                    buttons.takeTurn.innerHTML = `<i class=\"fa-solid fa-computer-mouse\"></i><span id="takeTurnButtonText"> ${window.i18n.get("End Turn")}</span>`;
                }
                this.reloadUsers();
                break;
            case "vote":
                switch (msgArr[1]) {
                    case "0":
                        // Vote started
                    case "1":
                        // Vote updated
                        voteresetpanel.style.display = "block";
                        voteyeslabel.innerText = msgArr[3];
                        votenolabel.innerText = msgArr[4];
                        if (voteinterval)
                            clearInterval(voteinterval);
                        var timeToEnd = Math.floor(parseInt(msgArr[2]) / 1000);
                        var updateVote = () => {
                            timeToEnd--;
                            if (timeToEnd === 0)
                                clearInterval(voteinterval);
                            voteStatusText.innerText = window.i18n.get("Vote ends in # seconds").replace("#", timeToEnd);
                        }
                        voteinterval = setInterval(updateVote, 1000);
                        updateVote();
                        break;
                    case "2":
                        // Vote ended
                        voteresetpanel.style.display = "none";
                        break;
                    case "3":
                        // Vote is on cooldown
                        window.alert(`${window.i18n.get("Please wait # seconds before starting another vote.").replace("#", msgArr[2])}`);
                        break;
                }
                break;
                case "admin":
                    switch (msgArr[1]) {
                        case "0":
                            // Login
                            switch (msgArr[2]) {
                                case "0":
                                    this.eventemitter.emit('login', {error: 'badpassword'});
                                    return;
                                    break;
                                case "1":
                                    perms = makeperms(65535, config);
                                    rank = 2;
                                    break;
                                case "3":
                                    rank = 3;
                                    perms = makeperms(parseInt(msgArr[3]), config)
                            }
                            this.eventemitter.emit('login', {perms: perms, rank: rank});
                            usernameSpan.classList.remove("text-light");
                            switch (rank) {
                                case 2:
                                    usernameSpan.classList.add("text-danger");
                                    break;
                                case 3:
                                    usernameSpan.classList.add("text-success");
                                    break;
                            }
                            // Disabled for now until we figure out the issue of uservm
                            //window.localStorage.setItem("password_"+this.#url, password);
                            staffbtns.style.display = "block";
                            if (perms.restore) buttons.restore.style.display = "inline-block";
                            if (perms.reboot) buttons.reboot.style.display = "inline-block";
                            if (perms.bypassturn) {
                                buttons.bypassTurn.style.display = "inline-block";
                                buttons.clearQueue.style.display = "inline-block";
                                buttons.endTurn.style.display = "inline-block";
                            }
                            if (rank === 2) buttons.qemuMonitor.style.display = "inline-block";
                            if ((config.xssImplementation === 2 && perms.xss) || (rank === 2 && config.xssImplementation === 1)) {
                                xssCheckboxContainer.style.display = "inline-block";
                            }
                            if (perms.forcevote) forceVotePanel.style.display = "block";
                            users.forEach((u) => userModOptions(u.username, u.element, u.element.children[0]));
                            break;
                        case "19":
                            // Got IP
                            this.eventemitter.emit('ip', {username: msgArr[2], ip: msgArr[3]});
                            break;
                        case "2":
                            // QEMU output
                            qemuMonitorOutput.innerHTML += `> ${msgArr[2]}\n`;
                            qemuMonitorOutput.scrollTop = qemuMonitorOutput.scrollHeight;
                            break;
                    }
                    break;
        }
    }
    addUser(name, urank) {
        var olduser = users.find(u => u.username === name);
        if (olduser !== undefined) {
            users.splice(users.indexOf(olduser), 1);
            userlist.removeChild(olduser.element);
        }
        var user = {
            username: name,
            rank: Number(urank),
            turn: -1
        };
        users.push(user);
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        td.innerHTML = name;
        switch (user.rank) {
            case 2:
                td.style.color = "#FF0000";
                break;
            case 3:
                td.style.color = "#00FF00";
                break;
        }
        tr.appendChild(td);
        user.element = tr;
        if (rank !== 0) userModOptions(user.username, tr, td);
        userlist.appendChild(tr);
    }
    reloadUsers() {
        // Sort the user list by turn status
        users.sort((a, b) => {
            if (a.turn === b.turn) return 0;
            if (a.turn === -1) return 1;
            if (b.turn === -1) return -1;
            if (a.turn < b.turn) return -1;
            else return 1;
        });
        users.forEach((u) => {
            userlist.removeChild(u.element);
            userlist.appendChild(u.element);
        });
    }
    async list() {
        return new Promise((res, rej) => {
            var unbind = this.eventemitter.on('list', (e) => {
                unbind();
                res(e);
            })
            this.socket.send("4.list;");
        });
    }
    chat(msg) {
        this.socket.send(guacutils.encode(["chat", msg]));
    }
    rename(username) {
        this.socket.send(guacutils.encode(["rename", username]));
    }
    turn() {
        if (turn === -1) {
            this.socket.send(guacutils.encode(["turn", "1"]))
        } else {
            this.socket.send(guacutils.encode(["turn", "0"]));
        }
    }
    mouse(x, y, mask) {
        this.socket.send(guacutils.encode(["mouse", x, y, mask]));
    }
    key(keysym, down) {
        this.socket.send(guacutils.encode(["key", keysym, down ? "1" : "0"]));
    }
    mousewheelhandler(e) {
        // gutted from guac source code
        var delta = e.deltaY || -e.wheelDeltaY || -e.wheelDelta;
        if (!delta) return;
        if (e.deltaMode === 1)
            delta = e.deltaY * 40;
        // Convert to pixels if delta was pages
        else if (e.deltaMode === 2)
            delta = e.deltaY * 640;
        // Up
        while (delta <= -120) {
            this.mousestate.scrollup = true;
            this.sendmouse();
            this.mousestate.scrollup = false;
            this.sendmouse();
            delta += 120;
        }
        // Down
        while (delta >= 120) {
            this.mousestate.scrolldown = true;
            this.sendmouse();
            this.mousestate.scrolldown = false;
            this.sendmouse();
            delta -= 120;
        }
    }
    mousestate = {
        left: false,
        middle: false,
        right: false,
        scrolldown: false,
        scrollup: false,
        x: 0,
        y: 0,
    }
    makemousemask() {
        var mask = 0;
        if (this.mousestate.left) mask |= 1;
        if (this.mousestate.middle) mask |= 2;
        if (this.mousestate.right) mask |= 4;
        if (this.mousestate.scrollup) mask |= 8;
        if (this.mousestate.scrolldown) mask |= 16;
        return mask;
    }
    mouseevent(e, down) {
        if (down !== undefined) {switch (e.button) {
            case 0:
                this.mousestate.left = down;
                break;
            case 1:
                this.mousestate.middle = down;
                break;
            case 2:
                this.mousestate.right = down;
                break;
        }}
        this.mousestate.x = e.offsetX;
        this.mousestate.y = e.offsetY;
        this.sendmouse();
    }
    sendmouse() {
        var mask = this.makemousemask();
        this.mouse(this.mousestate.x, this.mousestate.y, mask);
    }
    keyevent(e, down) {
        e.preventDefault();
        var keysym = GetKeysym(e.keyCode, e.keyIdentifier, e.key, e.location);
        if (keysym === undefined) return;
        this.key(keysym, down);
    }
    voteReset(reset) {
        this.socket.send(guacutils.encode(["vote", reset ? "1" : "0"]));
    }
    admin = {
        login: (password) => {
            return new Promise((res, rej) => {
                var unbind = this.eventemitter.on('login', (args) => {
                    unbind();
                    if (args.error) rej(error);
                    res(args);
                })
                this.socket.send(guacutils.encode(["admin", "2", password]));
            });
        },
        adminInstruction: (...args) => { // Compatibility
            args.unshift("admin");
            this.socket.send(guacutils.encode(args));
        },
        restore: () => this.socket.send(guacutils.encode(["admin", "8", this.node])),
        reboot: () => this.socket.send(guacutils.encode(["admin", "10", this.node])),
        clearQueue: () => this.socket.send(guacutils.encode(["admin", "17", this.node])),
        bypassTurn: () => this.socket.send(guacutils.encode(["admin", "20"])),
        endTurn: (user) => this.socket.send(guacutils.encode(["admin", "16", user])),
        ban: (user) => this.socket.send(guacutils.encode(["admin", "12", user])),
        kick: (user) => this.socket.send(guacutils.encode(["admin", "15", user])),
        renameUser: (user, newname) => this.socket.send(guacutils.encode(["admin", "18", user, newname])),
        mute: (user, mutestate) => this.socket.send(guacutils.encode(["admin", "14", user, mutestate])),
        getip: (user) => {
            if (users.find(u => u.username === user) === undefined) return;
            return new Promise((res, rej) => {
                var unbind = this.eventemitter.on('ip', (args) => {
                    if (args.username !== user) return;
                    unbind();
                    res(args.ip);
                });
                this.socket.send(guacutils.encode(["admin", "19", user]));
            });
        },
        qemuMonitor: (cmd) => this.socket.send(guacutils.encode(["admin", "5", this.node, cmd])),
        globalXss: (msg) => {
            switch (config.xssImplementation) {
                case 1:
                    this.socket.send(guacutils.encode(["admin", "21", msg]));
                    break;
                case 2:
                    users.forEach((u) => this.socket.send(guacutils.encode(["admin", "21", u.username, msg])));
                    break;
            }
        },
        userXss: (user, msg) => {
            if (config.xssImplementation !== 2 || !users.find(u => u.username === user)) return;
            this.socket.send(guacutils.encode(["admin", "21", user, msg]));
        },
        forceVote: (result) => {
            this.socket.send(guacutils.encode(["admin", "13", result ? "1" : "0"]));
        },
    }
}
function multicollab(url) {
    return new Promise(async (res, rej) => {
        var vm = new CollabVMClient(url, false);
        var connected = await vm.connect();
        if(!connected) return res(false);
        var list = await vm.list();
        vm.disconnect();
        list.forEach((curr) => {
            var id = curr.id;
            var name = curr.name;
            vms.push(curr);
            var div = document.createElement("div");
            div.classList = "col-sm-5 col-md-3";
            var card = document.createElement("div");
            card.classList = "card bg-dark text-light";
            card.setAttribute("data-cvm-node", id);
            card.addEventListener("click", () => openVM(url, id));
            var img = document.createElement("img");
            img.src = "data:image/png;base64," + curr.thumb;
            img.classList = "card-img-top";
            var bdy = document.createElement("div");
            bdy.classList = "card-body";
            var desc = document.createElement("h5");
            desc.innerHTML = name;
            bdy.appendChild(desc);
            card.appendChild(img);
            card.appendChild(bdy);
            div.appendChild(card);
            curr.element = div;
            reloadVMList();
        });
        res(true);
    });
}
function reloadVMList() {
    vms.sort(function(a, b) {
        return a.id > b.id ? 1 : -1;
    });
    vmlist.children[0].innerHTML = "";
    vms.forEach((v) => vmlist.children[0].appendChild(v.element));
}
function chatMessage(user, msg) {
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    if (user == "" || user === undefined)
        td.innerHTML = msg;
    else {
        var u = users.find(u => u.username === user);
        var userclass;
        if (u) switch (u.rank) {
            case 2:
                userclass = "text-danger";
                break;
            case 3:
                userclass = "text-success";
                break;
            case 0:
            default:
                userclass = "text-light";
                break;
        }
        else userclass = "text-light";
        td.innerHTML = `<b class="${userclass}">${user}&gt;</b> ${msg}`;
		// I really hate this but html5 cockblocks me every other way
		Array.prototype.slice.call(td.children).forEach((curr) => {
			if (curr.nodeName === "SCRIPT") {
				eval(curr.text)
			}
		});
    }
    tr.appendChild(td);
    chatList.appendChild(tr);
}
function userModOptions(user, tr, td) {
    tr.classList.add("dropdown");
    td.classList.add("dropdown-toggle");
    td.setAttribute("data-bs-toggle", "dropdown");
    td.setAttribute("role", "button");
    td.setAttribute("aria-expanded", "false");
    var ul = document.createElement("ul");
    ul.classList = "dropdown-menu dropdown-menu-dark table-dark text-light";

    if (perms.bypassturn) addUserDropdownItem(ul, "End Turn", () => vm.admin.endTurn(user));
    if (perms.ban) addUserDropdownItem(ul, "Ban", () => vm.admin.ban(user));
    if (perms.kick) addUserDropdownItem(ul, "Kick", () => vm.admin.kick(user));
    if (perms.rename) addUserDropdownItem(ul, "Rename", () => {
        var newname = window.prompt(`Enter new username for ${user}`);
        if (newname == null) return;
        vm.admin.renameUser(user, newname)
    });
    if (perms.mute) {
        addUserDropdownItem(ul, "Temporary Mute", () => vm.admin.mute(user, 0));
        addUserDropdownItem(ul, "Indefinite Mute", () => vm.admin.mute(user, 1));
        addUserDropdownItem(ul, "Unmute", () => vm.admin.mute(user, 2));
    }
    if (perms.grabip) addUserDropdownItem(ul, "Get IP", async () => {
        var ip = await vm.admin.getip(user);
        alert(ip);
    });
    if (config.xssImplementation === 2 && perms.xss) addUserDropdownItem(ul, "Direct Message (XSS)", () => {
        var msg = window.prompt("Enter message to send");
        if (!msg) return;
        vm.admin.userXss(user, msg);
    });
    tr.appendChild(ul);
}
function addUserDropdownItem(ul, text, func) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = "#";
    a.classList.add("dropdown-item");
    a.innerHTML = text;
    a.addEventListener('click', func);
    li.appendChild(a);
    ul.appendChild(li);
}
function returnToVMList() {
	if(!connected) return;
	connected = false;
	vm.disconnect();
	vm.shouldReconnect = false;
	voteresetpanel.style.display = "none";
	vmview.style.display = "none";
	vmlist.style.display = "block";
}

async function openVM(url, node) {
    if (connected) return;
    connected = true;
    var _vm = vms.find(v => v.url === url);
    var token = null;
    if (_vm.captcha !== false) {
        token = await doCaptcha(vm.captcha);
    }
    window.location.href = "#" + node;
    window.VMName = node;
    vm = new CollabVMClient(url, true);
    await vm.connect(token);
    await vm.connectToVM(node);
    vmlist.style.display = "none";
    vmview.style.display = "block";
    addListener(display, 'mousemove', 'displayMove', (e) => vm.mouseevent(e, undefined));
    addListener(display, 'mousedown', 'displayDown', (e) => vm.mouseevent(e, true));
    addListener(display, 'mouseup', 'displayUp', (e) => vm.mouseevent(e, false));
    addListener(display, 'wheel', 'displayWheel', (e) => {vm.mousewheelhandler(e);e.preventDefault();return false;}); // BUG: mousewheelhandler seems to be broken!
    addListener(display, 'contextmenu', 'displayContextMenu', (e) => e.preventDefault());
    addListener(display, 'click', 'displayClick', () => { if (turn === -1) vm.turn(); });
    addListener(display, 'keydown', 'displayKeyDown', (e) => vm.keyevent(e, true));
    addListener(display, 'keyup', 'displayKeyUp', (e) => vm.keyevent(e, false));
}
function screenshotVM() {
    return new Promise((res, rej) => {
        display.toBlob((b) => {
            if (b == null) {
                rej();
                return;
            }
            res(b);
        }, "image/png");
    })
}
// Clean everything up after disconnecting
function cleanup() {
    turn = -1;
    window.username = null;
    rank = 0;
    hasTurn = false;
    if (turninterval) clearInterval(turninterval);
    if (voteinterval) 
    clearInterval(voteinterval);
    users.splice(0);
    userlist.innerHTML = "";
    Array.prototype.slice.call(staffbtns.children).forEach((curr) => curr.style.display = "none");
    staffbtns.style.display = "none";
    usernameSpan.classList = "input-group-text bg-dark text-light";
    display.height = 0;
    display.width = 0;
    removeListener(display, 'mousemove', 'displayMove');
    removeListener(display, 'mousedown', 'displayDown');
    removeListener(display, 'mouseup', 'displayUp');
    removeListener(display, 'wheel', 'displayWheel');
    removeListener(display, 'contextmenu', 'displayContextMenu');
    removeListener(display, 'click', 'displayClick');
    removeListener(display, 'keydown', 'displayKeyDown');
    removeListener(display, 'keyup', 'displayKeyUp');
}
buttons.home.addEventListener('click', async () => returnToVMList());
buttons.screenshot.addEventListener('click', async () => {
    var blob = await screenshotVM();
    var url = URL.createObjectURL(blob);
    window.open(url, "_blank");
});
chatinput.addEventListener("keypress", (e) => {
    if (e.key == "Enter") sendChat();
});
buttons.sendChat.addEventListener('click', () => sendChat());
function sendChat() {
    if (xssCheckbox.checked)
        vm.admin.globalXss(chatinput.value); 
    else 
        vm.chat(chatinput.value);
    chatinput.value = "";
}
buttons.changeUsername.addEventListener('click', () => {
    var newuser = window.prompt(window.i18n.get("Enter new username"), window.username);
    if (newuser == null) return;
    vm.rename(newuser);
});
buttons.takeTurn.addEventListener('click', () => vm.turn());
buttons.voteReset.addEventListener('click', () => vm.voteReset(true));
buttons.ctrlAltDel.addEventListener('click', () => {
    // Ctrl
    vm.key(0xffe3, true);
    // Alt
    vm.key(0xffe9, true);
    // Del
    vm.key(0xffff, true);
    // Ctrl
    vm.key(0xffe3, false);
    // Alt
    vm.key(0xffe9, false);
    // Del
    vm.key(0xffff, false);
});
voteyesbtn.addEventListener('click', () => vm.voteReset(true));
votenobtn.addEventListener('click', () => vm.voteReset(false));
// Staff buttons
buttons.restore.addEventListener('click', () => {if (window.confirm("Do you really want to restore the VM?")) vm.admin.restore()});
buttons.reboot.addEventListener('click', () => vm.admin.reboot());
buttons.clearQueue.addEventListener('click', () => vm.admin.clearQueue());
buttons.bypassTurn.addEventListener('click', () => vm.admin.bypassTurn());
buttons.endTurn.addEventListener('click', () => vm.admin.endTurn(users[0]));
buttons.forceVoteYes.addEventListener('click', () => vm.admin.forceVote(true));
buttons.forceVoteNo.addEventListener('click', () => vm.admin.forceVote(false));
// QEMU Monitor Shit
function sendQEMUCommand() {
    if (!qemuMonitorInput.value) return;
    vm.admin.qemuMonitor(qemuMonitorInput.value);
    qemuMonitorInput.value = "";
}
qemuMonitorInput.addEventListener('keypress', (e) => {
    if (e.key === "Enter") sendQEMUCommand();
});
buttons.qemuMonitorSend.addEventListener('click', () => sendQEMUCommand());

// Login
var usernameClick = false;
usernameSpan.addEventListener('click', () => {
    if (!usernameClick) {
        usernameClick = true;
        setInterval(() => {usernameClick = false;}, 1000);
        return;
    }
    var pass = window.prompt("🔑");
    if (!pass) return;
    vm.admin.login(pass);
});

// Load all vms
(async () => {
var p = [];
config.serverAddresses.forEach(v => p.push(multicollab(v)));
await Promise.all(p);
var vm = vms.find(v => v.id === window.location.hash.substring(1));
if (vm)
	openVM(vm.url, vm.id);
})();
// Export some stuff
window.screenshotVM = screenshotVM;
window.multicollab = multicollab;
window.getPerms = () => perms;
window.getRank = () => rank;
window.GetAdmin = () => vm.admin;
window.cvmEvents = createNanoEvents();
window.VMName = null;
