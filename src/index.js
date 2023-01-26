import { guacutils } from "./protocol";
import { config } from "./common";
import { GetKeysym } from "./keyboard";
// None = -1
// Has turn = 0
// In queue = <queue position>
var turn = -1;
var perms = 0;
var connected = false;
const vms = [];
const users = [];
const buttons = {
    takeTurn: window.document.getElementById("takeTurnBtn"),
    changeUsername: window.document.getElementById("changeUsernameBtn"),
    voteReset: window.document.getElementById("voteResetButton"),
    screenshot: window.document.getElementById("screenshotButton")
}
var hasTurn = false;
var vm;
var connected = false;
var voteinterval;
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
// needed to scroll to bottom
const chatListDiv = document.querySelector(".chat-table");

class CollabVMClient {
    socket;
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
            var savedUsername = window.localStorage.getItem("username");
            if (savedUsername === null)
                this.socket.send(guacutils.encode(["rename"]));
            else this.socket.send(guacutils.encode(["rename", savedUsername]));
            var f = (e) => {
                var msgArr = guacutils.decode(e.data);
                if (msgArr[0] == "connect") {
                    switch (msgArr[1]) {
                        case "0":
                            rej("Failed to connect to the node");
                            break;
                        case "1":
                            res();
                            break;
                    }
                    this.socket.removeEventListener("message", f);
                }
            }
            this.socket.addEventListener("message", f);
            this.socket.send(guacutils.encode(["connect", node]));
        });
    }
    async #onMessage(event) {
        var msgArr = guacutils.decode(event.data);
        switch (msgArr[0]) {
            case "nop":
                this.socket.send("3.nop;");
                break;
            case "chat":
                if (!connected) return;
                for (var i = 1; i < msgArr.length; i += 2) {
                    chatMessage(msgArr[i], msgArr[i+1])
                }
                chatsound.play();
                chatListDiv.scrollTop = chatListDiv.scrollHeight;
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
                buttons.takeTurn.innerText = "Take Turn";
                turn = -1;
                turnstatus.innerText = "";
				display.className = "";
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
                    turnstatus.innerText = "You have the turn.";
					display.className = "focused";
					}
                // Highlight all waiting users and set their status
                if (queuedUsers > 1) {
                    for (var i = 1; i < queuedUsers; i++) {
                        if (window.username === msgArr[i+3]) {
                            turn = i;
                            turnstatus.innerText = "Waiting for turn";
							display.className = "waiting";
                        };
                        var user = users.find(u => u.username === msgArr[i+3]);
                        user.turn = i;
                        user.element.classList = "table-warning";
                    }
                }
                if (turn === -1) {
                    buttons.takeTurn.innerText = "Take Turn";
                } else {
                    buttons.takeTurn.innerText = "End Turn";
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
            var h = (e) => {
                var msgArr = guacutils.decode(e.data);
                if (msgArr[0] === "list") {
                    var list = [];
                    for (var i = 1; i < msgArr.length; i+=3) {
                        list.push({
                            url: this.#url,
                            id: msgArr[i],
                            name: msgArr[i+1],
                            thumb: msgArr[i+2],

                        });
                    }
                    this.socket.removeEventListener("message", h);
                    res(list);
                }
            };
            this.socket.addEventListener("message", h);
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
            vmlist.children[0].appendChild(div);
        }
        res(true);
    });
}
function chatMessage(username, msg) {
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    if (username == "" || username === undefined)
        td.innerHTML = msg;
    else td.innerHTML = `<b>${username}&gt;</b> ${msg}`;
    tr.appendChild(td);
    chatList.appendChild(tr);
}
async function openVM(url, node) {
    if (connected) return;
    connected = true;
    window.location.href = "#" + node;
    vm = new CollabVMClient(url);
    await vm.connect();
    connected = true;
    await vm.connectToVM(node);
    vmlist.style.display = "none";
    vmview.style.display = "block";
    display.addEventListener('mousemove', (e) => vm.mouseevent(e))
    display.addEventListener('mousedown', (e) => vm.mouseevent(e));
    display.addEventListener('mouseup', (e) => vm.mouseevent(e));
    display.addEventListener('contextmenu', (e) => e.preventDefault());
    display.addEventListener('click', () => {
        if (turn === -1) vm.turn();
    });
    display.addEventListener('keydown', (e) => vm.keyevent(e, true));
    display.addEventListener('keyup', (e) => vm.keyevent(e, false));
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
buttons.changeUsername.addEventListener('click', () => {
    var newuser = window.prompt("Enter new username", window.username);
    if (newuser == null) return;
    vm.rename(newuser);
});
buttons.takeTurn.addEventListener('click', () => vm.turn());
buttons.voteReset.addEventListener('click', () => vm.voteReset(true));
voteyesbtn.addEventListener('click', () => vm.voteReset(true));
votenobtn.addEventListener('click', () => vm.voteReset(false));

// Load all vms
config.serverAddresses.forEach(multicollab);
// Export some stuff
window.screenshotVM = screenshotVM;
window.multicollab = multicollab;