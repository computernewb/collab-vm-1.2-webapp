import { guacutils } from "./protocol";
import { config } from "./common";
import { GetKeysym } from "./keyboard";
import { createNanoEvents } from "nanoevents";
import { makeperms } from "./permissions";
// None = -1
// Has turn = 0
// In queue = <queue position>
var turn = -1;
var perms = makeperms(0);
var rank = 0;
var connected = false;
const vms = [];
const users = [];
const buttons = {
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
const votetime = document.getElementById("votetime");
const staffbtns = document.getElementById("staffbtns");
const qemuMonitorInput = document.getElementById("qemuMonitorInput");
const qemuMonitorOutput = document.getElementById("qemuMonitorOutput");
// needed to scroll to bottom
const chatListDiv = document.querySelector(".chat-table");

class CollabVMClient {
    eventemitter = createNanoEvents();
    socket;
    node;
    #url;
    constructor(url) {
        this.#url = url;
    }
    connect() {
        return new Promise((res, rej) => {
            this.socket = new WebSocket(this.#url, "guacamole");
            this.socket.addEventListener('message', (e) => this.#onMessage(e));
            this.socket.addEventListener('open', () => res(), {once: true});
        })

    }
    disconnect() {
        this.socket.send(guacutils.encode(["disconnect"]));
        this.socket.close();
    }
    getUrl() {
        return this.#url;
    }
    connectToVM(node) {
        return new Promise((res, rej) => {
            this.node = node;
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
            case "chat":
                if (!connected) return;
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
                    window.username = msgArr[3];
                    usernameSpan.innerText = msgArr[3];
                    window.localStorage.setItem("username", msgArr[3]);
                }
                var user = users.find(u => u.username == msgArr[2]);
                if (user === undefined) break;
                user.username = msgArr[3];
                user.element.children[0].innerHTML = msgArr[3];
                break;
            case "adduser":
                for (var i = 2; i < msgArr.length; i += 2) {
                    var olduser = users.find(u => u.username === msgArr[i]);
                    if (olduser !== undefined) {
                        users.splice(users.indexOf(olduser), 1);
                        userlist.removeChild(olduser.element);
                    }
                    var user = {
                        username: msgArr[i],
                        rank: Number(msgArr[i+1]),
                        turn: -1
                    };
                    users.push(user);
                    var tr = document.createElement("tr");
                    var td = document.createElement("td");
                    td.innerHTML = msgArr[i];
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
                onlineusercount.innerText = users.length;
                break;
            case "remuser":
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
                buttons.takeTurn.innerHTML = "<i class=\"fa-solid fa-computer-mouse\"></i> Take Turn";
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
                        turnstatus.innerText = `Turn expires in ${secs} seconds.`;
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
                                turnstatus.innerText = `Waiting for turn in ${secs} seconds.`;
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
                    buttons.takeTurn.innerHTML = "<i class=\"fa-solid fa-computer-mouse\"></i> Take Turn";
                } else {
                    buttons.takeTurn.innerHTML = "<i class=\"fa-solid fa-computer-mouse\"></i> End Turn";
                }
                this.reloadUsers();
                break;
            case "vote":
                console.log(msgArr);
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
                            votetime.innerText = timeToEnd;
                        }
                        voteinterval = setInterval(updateVote, 1000);
                        updateVote();
                        break;
                    case "2":
                        // Vote ended
                        voteresetpanel.style.display = "none";
                        break;
                    case "3":
                        // too soon dumbass
                        window.alert(`Please wait ${msgArr[2]} seconds before starting another vote.`);
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
                                    perms = makeperms(65535);
                                    rank = 2;
                                    break;
                                case "3":
                                    rank = 3;
                                    perms = makeperms(parseInt(msgArr[3]))
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
                default:
                    window.cvmEvents.emit(msgArr[0], msgArr.slice(1));
                    break;
        }
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
    mouseevent(e) {
        var mask = 0;
        if ((e.buttons & 1) !== 0) mask |= 1;
        if ((e.buttons & 4) !== 0) mask |= 2;
        if ((e.buttons & 2) !== 0) mask |= 4;
        this.mouse(e.offsetX, e.offsetY, mask);
    }
    keyevent(e, down) {
        e.preventDefault();
        var keysym = GetKeysym(e.keyCode, e.keyIdentifier, e.key, e.location);
        console.log(keysym);
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
            console.log(args);
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
    }
}
function multicollab(url) {
    return new Promise(async (res, rej) => {
        var vm = new CollabVMClient(url);
        await vm.connect();
        var list = await vm.list();
        vm.disconnect();
        for (var i = 0; i < list.length; i++) {
            var id = list[i].id;
            var name = list[i].name;
            if (id === window.location.hash.substring(1)) {
                openVM(url, id);
                res(false);
            }
            vms.push(list[i]);
            var div = document.createElement("div");
            div.classList = "col-sm-4";
            var card = document.createElement("div");
            card.classList = "card bg-dark text-light";
            card.setAttribute("data-cvm-node", id);
            card.addEventListener("click", () => openVM(url, id));
            var img = document.createElement("img");
            img.src = "data:image/png;base64," + list[i].thumb;
            img.classList = "card-img-top";
            var bdy = document.createElement("div");
            bdy.classList = "card-body";
            var desc = document.createElement("h5");
            desc.innerHTML = name;
            bdy.appendChild(desc);
            card.appendChild(img);
            card.appendChild(bdy);
            div.appendChild(card);
            list[i].element = div;
            reloadVMList();
        }
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
async function openVM(url, node) {
    if (connected) return;
    connected = true;
    window.location.href = "#" + node;
    vm = new CollabVMClient(url);
    await vm.connect();
    await vm.connectToVM(node);
    vmlist.style.display = "none";
    vmview.style.display = "block";
    display.addEventListener('mousemove', (e) => vm.mouseevent(e), {capture: true})
    display.addEventListener('mousedown', (e) => vm.mouseevent(e), {capture: true});
    display.addEventListener('mouseup', (e) => vm.mouseevent(e), {capture: true});
    display.addEventListener('contextmenu', (e) => e.preventDefault());
    display.addEventListener('click', () => {
        if (turn === -1) vm.turn();
    }, {capture: true});
    display.addEventListener('keydown', (e) => vm.keyevent(e, true), {capture: true});
    display.addEventListener('keyup', (e) => vm.keyevent(e, false), {capture: true});
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
buttons.screenshot.addEventListener('click', async () => {
    var blob = await screenshotVM();
    var url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    URL.revokeObjectURL(url);
});
chatinput.addEventListener("keypress", (e) => {
    if (e.key == "Enter") {
        vm.chat(chatinput.value);
        chatinput.value = "";
    }
});
buttons.sendChat.addEventListener('click', () => {
    vm.chat(chatinput.value);
    chatinput.value = "";
});
buttons.changeUsername.addEventListener('click', () => {
    var newuser = window.prompt("Enter new username", window.username);
    if (newuser == null) return;
    vm.rename(newuser);
});
buttons.takeTurn.addEventListener('click', () => vm.turn());
buttons.voteReset.addEventListener('click', () => vm.voteReset(true));
voteyesbtn.addEventListener('click', () => vm.voteReset(true));
votenobtn.addEventListener('click', () => vm.voteReset(false));
// Staff buttons
buttons.restore.addEventListener('click', () => vm.admin.restore());
buttons.reboot.addEventListener('click', () => vm.admin.reboot());
buttons.clearQueue.addEventListener('click', () => vm.admin.clearQueue());
buttons.bypassTurn.addEventListener('click', () => vm.admin.bypassTurn());
buttons.endTurn.addEventListener('click', () => vm.admin.endTurn(users[0]));
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
config.serverAddresses.forEach(multicollab);
// Export some stuff
window.screenshotVM = screenshotVM;
window.multicollab = multicollab;
window.getPerms = () => perms;
window.getRank = () => rank;
window.GetAdmin = () => vm.admin;
window.cvmEvents = createNanoEvents();