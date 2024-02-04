import CollabVMClient from "./protocol/CollabVMClient.js";
import VM from "./protocol/VM.js";
import { Config } from "../../Config.js";
import { Permissions, Rank } from "./protocol/Permissions.js";
import { User } from "./protocol/User.js";
import TurnStatus from "./protocol/TurnStatus.js";
import Keyboard from "simple-keyboard";
import { OSK_buttonToKeysym } from "./keyboard";
import "simple-keyboard/build/css/index.css";
import VoteStatus from "./protocol/VoteStatus.js";
import * as bootstrap from "bootstrap";
import MuteState from "./protocol/MuteState.js";

// Elements
const w = window as any;
const elements = {
    vmlist: document.getElementById('vmlist') as HTMLDivElement,
    vmview: document.getElementById('vmview') as HTMLDivElement,
    vmDisplay: document.getElementById('vmDisplay') as HTMLDivElement,
    homeBtn: document.getElementById('homeBtn') as HTMLAnchorElement,
    chatList: document.getElementById('chatList') as HTMLTableSectionElement,
    chatListDiv: document.getElementById('chatListDiv') as HTMLDivElement,
    userlist: document.getElementById('userlist') as HTMLTableSectionElement,
    onlineusercount: document.getElementById("onlineusercount") as HTMLSpanElement,
    username: document.getElementById("username") as HTMLSpanElement,
    chatinput: document.getElementById("chat-input") as HTMLInputElement,
    sendChatBtn: document.getElementById("sendChatBtn") as HTMLButtonElement,
    takeTurnBtn: document.getElementById("takeTurnBtn") as HTMLButtonElement,
    changeUsernameBtn: document.getElementById("changeUsernameBtn") as HTMLButtonElement,
    turnBtnText: document.getElementById("turnBtnText") as HTMLSpanElement,
    turnstatus: document.getElementById("turnstatus") as HTMLParagraphElement,
    osk: window.document.getElementById("oskBtn") as HTMLButtonElement,
    oskContainer: document.getElementById("osk-container") as HTMLDivElement,
    screenshotButton: document.getElementById("screenshotButton") as HTMLButtonElement,
    voteResetButton: document.getElementById("voteResetButton") as HTMLButtonElement,
    voteResetPanel: document.getElementById("voteResetPanel") as HTMLDivElement,
    voteYesBtn: document.getElementById("voteYesBtn") as HTMLButtonElement,
    voteNoBtn: document.getElementById("voteNoBtn") as HTMLButtonElement,
    voteYesLabel: document.getElementById("voteYesLabel") as HTMLSpanElement,
    voteNoLabel: document.getElementById("voteNoLabel") as HTMLSpanElement,
    votetime: document.getElementById("votetime") as HTMLSpanElement,
    loginModal: document.getElementById("loginModal") as HTMLDivElement,
    adminPassword: document.getElementById("adminPassword") as HTMLInputElement,
    loginButton: document.getElementById("loginButton") as HTMLButtonElement,
    adminInputVMID: document.getElementById("adminInputVMID") as HTMLInputElement,
    badPasswordAlert: document.getElementById("badPasswordAlert") as HTMLDivElement,
    incorrectPasswordDismissBtn: document.getElementById("incorrectPasswordDismissBtn") as HTMLButtonElement,
    // Admin
    staffbtns: document.getElementById("staffbtns") as HTMLDivElement,
    restoreBtn: document.getElementById("restoreBtn") as HTMLButtonElement,
    rebootBtn: document.getElementById("rebootBtn") as HTMLButtonElement,
    clearQueueBtn: document.getElementById("clearQueueBtn") as HTMLButtonElement,
    bypassTurnBtn: document.getElementById("bypassTurnBtn") as HTMLButtonElement,
    endTurnBtn: document.getElementById("endTurnBtn") as HTMLButtonElement,
    qemuMonitorBtn: document.getElementById("qemuMonitorBtn") as HTMLButtonElement,
    xssCheckboxContainer: document.getElementById("xssCheckboxContainer") as HTMLDivElement,
    xssCheckbox: document.getElementById("xssCheckbox") as HTMLInputElement,
    forceVotePanel: document.getElementById("forceVotePanel") as HTMLDivElement,
    forceVoteYesBtn: document.getElementById("forceVoteYesBtn") as HTMLButtonElement,
    forceVoteNoBtn: document.getElementById("forceVoteNoBtn") as HTMLButtonElement,
    indefTurnBtn: document.getElementById("indefTurnBtn") as HTMLButtonElement,
    qemuMonitorInput: document.getElementById("qemuMonitorInput") as HTMLInputElement,
    qemuMonitorSendBtn: document.getElementById("qemuMonitorSendBtn") as HTMLButtonElement,
    qemuMonitorOutput: document.getElementById("qemuMonitorOutput") as HTMLTextAreaElement,
}

/* Start OSK */
let commonKeyboardOptions = {
    onKeyPress: (button: string) => onKeyPress(button),
    theme: "simple-keyboard hg-theme-default cvmDark cvmDisabled hg-layout-default",
    syncInstanceInputs: true,
    mergeDisplay: true
  };
  
  let keyboard = new Keyboard(".osk-main", {
    ...commonKeyboardOptions,
    layout: {
      default: [
        "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "` 1 2 3 4 5 6 7 8 9 0 - = {backspace}",
        "{tab} q w e r t y u i o p [ ] \\",
        "{capslock} a s d f g h j k l ; ' {enter}",
        "{shiftleft} z x c v b n m , . / {shiftright}",
        "{controlleft} {metaleft} {altleft} {space} {altright} {metaright} {controlright}"
      ],
      shift: [
        "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "~ ! @ # $ % ^ & * ( ) _ + {backspace}",
        "{tab} Q W E R T Y U I O P { } |",
        '{capslock} A S D F G H J K L : " {enter}',
        "{shiftleft} Z X C V B N M < > ? {shiftright}",
        "{controlleft} {metaleft} {altleft} {space} {altright} {metaright} {controlright}"
      ],
      capslock: [
        "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "` 1 2 3 4 5 6 7 8 9 0 - = {backspace}",
        "{tab} Q W E R T Y U I O P [ ] \\",
        "{capslock} A S D F G H J K L ; ' {enter}",
        "{shiftleft} Z X C V B N M , . / {shiftright}",
        "{controlleft} {metaleft} {altleft} {space} {altright} {metaright} {controlright}"
      ],
      shiftcaps: [
        "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "~ ! @ # $ % ^ & * ( ) _ + {backspace}",
        "{tab} q w e r t y u i o p { } |",
        '{capslock} a s d f g h j k l : " {enter}',
        "{shiftleft} z x c v b n m < > ? {shiftright}",
        "{controlleft} {metaleft} {altleft} {space} {altright} {metaright} {controlright}"
      ]
    },
    display: {
      "{escape}": "Esc",
      "{tab}": "Tab",
      "{backspace}": "Back",
      "{enter}": "Enter",
      "{capslock}": "Caps",
      "{shiftleft}": "Shift",
      "{shiftright}": "Shift",
      "{controlleft}": "Ctrl",
      "{controlright}": "Ctrl",
      "{altleft}": "Alt",
      "{altright}": "Alt",
      "{metaleft}": "Super",
      "{metaright}": "Menu"
    }
  });
  
  let keyboardControlPad = new Keyboard(".osk-control", {
    ...commonKeyboardOptions,
    layout: {
      default: [
        "{prtscr} {scrolllock} {pause}",
        "{insert} {home} {pageup}",
        "{delete} {end} {pagedown}"
      ]
    },
    display: {
      "{prtscr}": "Print",
      "{scrolllock}": "Scroll",
      "{pause}": "Pause",
      "{insert}": "Ins",
      "{home}": "Home",
      "{pageup}": "PgUp",
      "{delete}": "Del",
      "{end}": "End",
      "{pagedown}": "PgDn",
    }
  });
  
  let keyboardArrows = new Keyboard(".osk-arrows", {
    ...commonKeyboardOptions,
    layout: {
      default: ["{arrowup}", "{arrowleft} {arrowdown} {arrowright}"]
    }
  });
  
  let keyboardNumPad = new Keyboard(".osk-numpad", {
    ...commonKeyboardOptions,
    layout: {
      default: [
        "{numlock} {numpaddivide} {numpadmultiply}",
        "{numpad7} {numpad8} {numpad9}",
        "{numpad4} {numpad5} {numpad6}",
        "{numpad1} {numpad2} {numpad3}",
        "{numpad0} {numpaddecimal}"
      ]
    }
  });
  
  let keyboardNumPadEnd = new Keyboard(".osk-numpadEnd", {
    ...commonKeyboardOptions,
    layout: {
      default: ["{numpadsubtract}", "{numpadadd}", "{numpadenter}"]
    }
  });
  
  let shiftHeld = false;
  let ctrlHeld = false;
  let capsHeld = false;
  let altHeld = false;
  let metaHeld = false;
  
  const setButtonBackground = (selectors: string, condition: boolean) => {
    for(let button of document.querySelectorAll(selectors) as NodeListOf<HTMLDivElement>) {
      button.style.backgroundColor = condition ? "#1c4995" : "rgba(0, 0, 0, 0.5)";
    };
  };
  
  const enableOSK = (enable: boolean) => {
      const theme = `simple-keyboard hg-theme-default cvmDark ${enable ? "" : "cvmDisabled"} hg-layout-default`;    
      [keyboard, keyboardControlPad, keyboardArrows, keyboardNumPad, keyboardNumPadEnd].forEach(part => {
          part.setOptions({
              theme: theme,
          });
      });
  
      if(enable) updateOSKStyle();
  }
  
  const updateOSKStyle = () => {
    setButtonBackground(".hg-button-shiftleft, .hg-button-shiftright", shiftHeld);
    setButtonBackground(".hg-button-controlleft, .hg-button-controlright", ctrlHeld);
    setButtonBackground(".hg-button-capslock", capsHeld);
    setButtonBackground(".hg-button-altleft, .hg-button-altright", altHeld);
    setButtonBackground(".hg-button-metaleft, .hg-button-metaright", metaHeld);
  }
  
  
  function onKeyPress(button: string) {
    if (VM === null) return;
    let keysym = OSK_buttonToKeysym(button);
    if (!keysym) {
      console.error(`no keysym for ${button}, report this!`);
      return;
    }
  
    switch (true) {
      case button.startsWith("{shift"):
        shiftHeld = !shiftHeld;
        VM.key(keysym, shiftHeld);
        break;
      case button.startsWith("{control"):
        ctrlHeld = !ctrlHeld;
        VM.key(keysym, ctrlHeld);
        break;
      case button === "{capslock}":
        capsHeld = !capsHeld;
        VM.key(keysym, capsHeld);
        break;
      case button.startsWith("{alt"):
        altHeld = !altHeld;
        VM.key(keysym, altHeld);
        break;
      case button.startsWith("{meta"):
        metaHeld = !metaHeld;
        VM.key(keysym, metaHeld);
        break;
      default:
        VM.key(keysym, true);
        VM.key(keysym, false);
    }
  
    keyboard.setOptions({
      layoutName: shiftHeld && capsHeld ? "shiftcaps" : shiftHeld ? "shift" : capsHeld ? "capslock" : "default"
    });
  
    updateOSKStyle();
  }
  
  /* End OSK */  

var expectedClose = false;
var turn = -1;
// Listed VMs
const vms : VM[] = [];
const cards : HTMLDivElement[] = [];
const users : {
    user : User,
    element : HTMLTableRowElement
}[] = [];
var turnInterval : number | undefined = undefined;
var voteInterval : number | undefined = undefined;
var turnTimer = 0;
var voteTimer = 0;
var rank : Rank = Rank.Unregistered;
var perms : Permissions = new Permissions(0);
const chatsound = new Audio(Config.ChatSound);

// Active VM
var VM : CollabVMClient | null = null;

function multicollab(url : string) {
    return new Promise<void>(async (res, rej) => {
        // Create the client
        var client = new CollabVMClient(url);
        // Wait for the client to open
        await new Promise<void>(res => client.on('open', () => res()));
        // Get the list of VMs
        var list = await client.list();
        // Get the number of online users
        var online = client.getUsers().length;
        // Close the client
        client.close();
        // Add to the list
        vms.push(...list);
        // Add to the DOM
        for (var vm of list) {
            var div = document.createElement('div');
            div.classList.add("col-sm-5", "col-md-3");
            var card = document.createElement('div');
            card.classList.add("card", "bg-dark", "text-light");
            card.setAttribute("data-cvm-node", vm.id);
            card.addEventListener('click', () => openVM(vm));
            vm.thumbnail.classList.add("card-img-top");
            var cardBody = document.createElement('div');
            cardBody.classList.add("card-body");
            var cardTitle = document.createElement('h5');
            cardTitle.innerHTML = vm.displayName;
            var usersOnline = document.createElement("span");
            usersOnline.innerHTML = `(<i class="fa-solid fa-users"></i> ${online})`;
            cardBody.appendChild(cardTitle);
            cardBody.appendChild(usersOnline);
            card.appendChild(vm.thumbnail);
            card.appendChild(cardBody);
            div.appendChild(card);
            cards.push(div);
            sortVMList();
        }
        res();
    });
}
function openVM(vm : VM) {
    return new Promise<void>(async (res, rej) => {
        // If there's an active VM it must be closed before opening another
        if (VM !== null) return;
        expectedClose = false;
        // Set hash
        location.hash = vm.id;
        // Create the client
        VM = new CollabVMClient(vm.url);
        // Register event listeners
        // An array to keep track of all listeners, and remove them when the VM is closed. Might not be necessary, but it's good practice.
        var listeners : (() => void)[] = [];
        listeners.push(VM!.on('chat', (username, message) => chatMessage(username, message)));
        listeners.push(VM!.on('adduser', (user) => addUser(user)));
        listeners.push(VM!.on('remuser', (user) => remUser(user)));
        listeners.push(VM!.on('rename', (oldname, newname, selfrename) => userRenamed(oldname, newname, selfrename)));
        listeners.push(VM!.on('renamestatus', (status) => {
            switch (status) {
                case 'taken': alert("That username is already taken"); break;
                case 'invalid': alert("Usernames can contain only numbers, letters, spaces, dashes, underscores, and dots, and it must be between 3 and 20 characters."); break;
                case 'blacklisted': alert("That username has been blacklisted."); break;
            }
        }));
        listeners.push(VM!.on('turn', status => turnUpdate(status)));
        listeners.push(VM!.on('vote', (status : VoteStatus) => voteUpdate(status)));
        listeners.push(VM!.on('voteend', () => voteEnd()));
        listeners.push(VM!.on('votecd', cd => window.alert(`Please wait ${cd} seconds before starting another vote.`)));
        listeners.push(VM!.on('login', (rank : Rank, perms : Permissions) => onLogin(rank, perms)));
        listeners.push(VM!.on('close', () => {
            if (!expectedClose) alert("You have been disconnected from the server");
            for (var l of listeners) l();
            closeVM();
        }));
        // Wait for the client to open
        await new Promise<void>(res => VM!.on('open', () => res()));
        // Connect to node
        chatMessage("", `<b>${vm.id}</b><hr>`);
        var connected = await VM.connect(vm.id);
        elements.adminInputVMID.value = vm.id;
        w.VMName = vm.id;
        if (!connected) {
            VM.close();
            VM = null;
            rej("Failed to connect to node");
        }
        // Set the title
        document.title = vm.id + " - CollabVM";
        // Append canvas
        elements.vmDisplay.appendChild(VM!.canvas);
        // Switch to the VM view
        elements.vmlist.style.display = "none";
        elements.vmview.style.display = "block";
    });
}

function closeVM() {
    if (VM === null) return;
    expectedClose = true;
    // Close the VM
    VM.close();
    VM = null;
    document.title = "CollabVM";
    turn = -1;
    // Remove the canvas
    elements.vmDisplay.innerHTML = "";
    // Switch to the VM list
    elements.vmlist.style.display = "block";
    elements.vmview.style.display = "none";
    // Clear users
    users.splice(0, users.length);
    elements.userlist.innerHTML = "";
    rank = Rank.Unregistered;
    perms = new Permissions(0);
    w.VMName = null;
    // Reset admin and vote panels
    elements.staffbtns.style.display = "none";
    elements.restoreBtn.style.display = "none";
    elements.rebootBtn.style.display = "none";
    elements.bypassTurnBtn.style.display = "none";
    elements.endTurnBtn.style.display = "none";
    elements.clearQueueBtn.style.display = "none";
    elements.qemuMonitorBtn.style.display = "none";
    elements.indefTurnBtn.style.display = "none";
    elements.xssCheckboxContainer.style.display = "none";
    elements.forceVotePanel.style.display = "none";
    elements.voteResetPanel.style.display = "none";
    elements.voteYesLabel.innerText = "0";
    elements.voteNoLabel.innerText = "0";
    elements.xssCheckbox.checked = false;
}

function loadList() {
    return new Promise<void>(async res => {
        var p = [];
        for (var url of Config.ServerAddresses) {
            p.push(multicollab(url));
        }
        await Promise.all(p);
        var v = vms.find(v => v.id === window.location.hash.substring(1));
        if (v !== undefined) openVM(v);
        res();
    });
}

function sortVMList() {
    cards.sort(function(a, b) {
        return a.children[0].getAttribute("data-cvm-node")! > b.children[0].getAttribute("data-cvm-node")! ? 1 : -1;
    });
    elements.vmlist.children[0].innerHTML = "";
    cards.forEach((c) => elements.vmlist.children[0].appendChild(c));
}

function sortUserList() {
    users.sort((a, b) => {
        if (a.user.username === w.username && (a.user.turn >= b.user.turn) && b.user.turn !== 0) return -1;
        if (b.user.username === w.username && (b.user.turn >= a.user.turn) && a.user.turn !== 0) return 1;
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

function chatMessage(username : string, message : string) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    // System message
    if (username === "") td.innerHTML = message;
    else {
        var user = VM!.getUsers().find(u => u.username === username);
        var rank;
        if (user !== undefined) rank = user.rank;
        else rank = Rank.Unregistered;
        var userclass;
        var msgclass;
        switch (rank) {
            case Rank.Unregistered:
                userclass = "chat-username-unregistered";
                msgclass = "chat-unregistered";
                break;
            case Rank.Admin:
                userclass = "chat-username-admin";
                msgclass = "chat-admin";
                break;
            case Rank.Moderator:
                userclass = "chat-username-moderator";
                msgclass = "chat-moderator";
                break;
        }
        tr.classList.add(msgclass);
        td.innerHTML = `<b class="${userclass}">${username}▸</b> ${message}`;
        // hacky way to allow scripts
        Array.prototype.slice.call(td.children).forEach((curr) => {
            if (curr.nodeName === "SCRIPT") {
                eval(curr.text)
            }
        });
    }
    tr.appendChild(td);
    elements.chatList.appendChild(tr);
    elements.chatListDiv.scrollTop = elements.chatListDiv.scrollHeight;
    chatsound.play();
}

function addUser(user : User) {
    var olduser = users.find(u => u.user === user);
    if (olduser !== undefined) elements.userlist.removeChild(olduser.element);
    var tr = document.createElement('tr');
    tr.setAttribute("data-cvm-turn", "-1");
    var td = document.createElement('td');
    td.innerHTML = user.username;
    switch (user.rank) {
        case Rank.Admin:
            tr.classList.add("user-admin");
            break;
        case Rank.Moderator:
            tr.classList.add("user-moderator");
            break;
        case Rank.Unregistered:
            tr.classList.add("user-unregistered");
            break;
    }
    if (user.username === w.username)
        tr.classList.add("user-current");
    tr.appendChild(td);
    var u = {user: user, element: tr};
    if (rank !== Rank.Unregistered) userModOptions(u);
    elements.userlist.appendChild(tr);
    if (olduser !== undefined) olduser.element = tr;
    else users.push(u);
    elements.onlineusercount.innerHTML = VM!.getUsers().length.toString();
}

function remUser(user : User) {
    var olduser = users.findIndex(u => u.user === user);
    if (olduser !== undefined) elements.userlist.removeChild(users[olduser].element);
    elements.onlineusercount.innerHTML = VM!.getUsers().length.toString();
    users.splice(olduser, 1);
}

function userRenamed(oldname : string, newname : string, selfrename : boolean) {
    var user = users.find(u => u.user.username === newname);
    if (user) {
        user.element.children[0].innerHTML = newname;
    }
    if (selfrename) {
        w.username = newname;
        elements.username.innerText = newname;
        localStorage.setItem("username", newname);
    }
}

function turnUpdate(status : TurnStatus) {
    // Clear all turn data
    turn = -1;
    VM!.canvas.classList.remove("focused", "waiting");
    clearInterval(turnInterval);
    turnTimer = 0;
    for (const user of users) {
        user.element.classList.remove("user-turn", "user-waiting");
        user.element.setAttribute("data-cvm-turn", "-1");
    }
    elements.turnBtnText.innerHTML = "Take Turn";
    enableOSK(false);

    if (status.user !== null) {
        var el = users.find(u => u.user === status.user)!.element;
        el!.classList.add("user-turn");
        el!.setAttribute("data-cvm-turn", "0");
    }
    for (const user of status.queue) {
        var el = users.find(u => u.user === user)!.element;
        el!.classList.add("user-waiting");
        el.setAttribute("data-cvm-turn", status.queue.indexOf(user).toString(10))
    }
    if (status.user?.username === w.username) {
        turn = 0;
        turnTimer = status.turnTime! / 1000;
        elements.turnBtnText.innerHTML = "End Turn";
        VM!.canvas.classList.add("focused");
        enableOSK(true);
    }
    if (status.queue.some(u => u.username === w.username)) {
        turn = status.queue.findIndex(u => u.username === w.username) + 1;
        turnTimer = status.queueTime! / 1000;
        elements.turnBtnText.innerHTML = "End Turn";
        VM!.canvas.classList.add("waiting");
    }
    if (turn === -1) elements.turnstatus.innerText = "";
    else {
        turnInterval = setInterval(() => turnIntervalCb(), 1000);
        setTurnStatus();
    }
    sortUserList();
}

function voteUpdate(status : VoteStatus) {
  clearInterval(voteInterval);
  elements.voteResetPanel.style.display = "block";
  elements.voteYesLabel.innerText = status.yesVotes.toString();
  elements.voteNoLabel.innerText = status.noVotes.toString();
  voteTimer = Math.floor(status.timeToEnd / 1000);
  voteInterval = setInterval(() => updateVoteEndTime(), 1000);
  updateVoteEndTime();
}

function updateVoteEndTime() {
  voteTimer--;
  elements.votetime.innerText = voteTimer.toString();
  if (voteTimer === 0) clearInterval(voteInterval);
}

function voteEnd() {
  clearInterval(voteInterval);
  elements.voteResetPanel.style.display = "none";
}

function turnIntervalCb() {
    turnTimer--;
    setTurnStatus();
}

function setTurnStatus() {
    if (turn === 0)
        elements.turnstatus.innerText = `Turn expires in ${turnTimer} seconds`;
    else
        elements.turnstatus.innerText = `Waiting for turn in ${turnTimer} seconds`;
}

function sendChat() {
    if (VM === null) return;
    if (elements.xssCheckbox.checked) VM.xss(elements.chatinput.value);
    else VM.chat(elements.chatinput.value);
    elements.chatinput.value = "";
}

// Bind list buttons
elements.homeBtn.addEventListener('click', () => closeVM());

// Bind VM view buttons
elements.sendChatBtn.addEventListener('click', sendChat);
elements.chatinput.addEventListener('keypress', (e) => {
    if (e.key === "Enter") sendChat();
});
elements.changeUsernameBtn.addEventListener('click', () => {
    var newname = prompt("Enter new username, or leave blank to be assigned a guest username", w.username);
    if (newname === w.username) return;
    VM?.rename(newname);
});
elements.takeTurnBtn.addEventListener('click', () => {
    VM?.turn(turn === -1);
});
elements.screenshotButton.addEventListener('click', () => {
  if (!VM) return;
  VM.canvas.toBlob(blob => {
    open(URL.createObjectURL(blob!), '_blank');
  })
});
elements.voteResetButton.addEventListener('click', () => VM?.vote(true));
elements.voteYesBtn.addEventListener('click', () => VM?.vote(true));
elements.voteNoBtn.addEventListener('click', () => VM?.vote(false));
// Login
var usernameClick = false;
const loginModal = new bootstrap.Modal(elements.loginModal);
elements.loginModal.addEventListener('shown.bs.modal', () => elements.adminPassword.focus());
elements.username.addEventListener('click', () => {
  if (!usernameClick) {
    usernameClick = true;
    setInterval(() => usernameClick = false, 1000);
    return;
  }
  loginModal.show();
});
elements.loginButton.addEventListener('click', () => doLogin());
elements.adminPassword.addEventListener('keypress', (e) => e.key === "Enter" && doLogin());
elements.incorrectPasswordDismissBtn.addEventListener('click', () => elements.badPasswordAlert.style.display = "none");
function doLogin() {
  var adminPass = elements.adminPassword.value;
  if (adminPass === "") return;
  VM?.login(adminPass);
  elements.adminPassword.value = "";
  var u = VM?.on('login', () => {
    u!();
    loginModal.hide();
    elements.badPasswordAlert.style.display = "none";
  });
  var _u = VM?.on('badpw', () => {
    _u!();
    elements.badPasswordAlert.style.display = "block";
  });
}

function onLogin(_rank : Rank, _perms : Permissions) {
  rank = _rank;
  perms = _perms;
  elements.staffbtns.style.display = "block";
  if (_perms.restore) elements.restoreBtn.style.display = "inline-block";
  if (_perms.reboot) elements.rebootBtn.style.display = "inline-block";
  if (_perms.bypassturn) {
    elements.bypassTurnBtn.style.display = "inline-block";
    elements.endTurnBtn.style.display = "inline-block";
    elements.clearQueueBtn.style.display = "inline-block";
  }
  if (_rank === Rank.Admin) {
    elements.qemuMonitorBtn.style.display = "inline-block";
    elements.indefTurnBtn.style.display = "inline-block";
  }
  if (_perms.xss) elements.xssCheckboxContainer.style.display = "inline-block";
  if (_perms.forcevote) elements.forceVotePanel.style.display = "block";
  for (const user of users) userModOptions(user);
}

function userModOptions(user : {
  user : User,
  element : HTMLTableRowElement
}) {
  var tr = user.element;
  var td = tr.children[0] as HTMLTableCellElement;
  tr.classList.add("dropdown");
  td.classList.add("dropdown-toggle");
  td.setAttribute("data-bs-toggle", "dropdown");
  td.setAttribute("role", "button");
  td.setAttribute("aria-expanded", "false");
  var ul = document.createElement('ul');
  ul.classList.add("dropdown-menu", "dropdown-menu-dark", "table-dark", "text-light");
  if (perms.bypassturn) addUserDropdownItem(ul, "End Turn", () => VM!.endTurn(user.user.username));
  if (perms.ban) addUserDropdownItem(ul, "Ban", () => VM!.ban(user.user.username));
  if (perms.kick) addUserDropdownItem(ul, "Kick", () => VM!.kick(user.user.username));
  if (perms.rename) addUserDropdownItem(ul, "Rename", () => {
    var newname = prompt(`Enter new username for ${user.user.username}`);
    if (!newname) return;
    VM!.renameUser(user.user.username, newname);
  });
  if (perms.mute) {
    addUserDropdownItem(ul, "Temporary Mute", () => VM!.mute(user.user.username, MuteState.Temp));
    addUserDropdownItem(ul, "Indefinite Mute", () => VM!.mute(user.user.username, MuteState.Perma));
    addUserDropdownItem(ul, "Unmute", () => VM!.mute(user.user.username, MuteState.Unmuted));
  }
  if (perms.grabip) addUserDropdownItem(ul, "Get IP", async () => {
    var ip = await VM!.getip(user.user.username);
    alert(ip);
  });
  tr.appendChild(ul);
}

function addUserDropdownItem(ul : HTMLUListElement, text : string, func : () => void) {
  var li = document.createElement('li');
  var a = document.createElement('a');
  a.href = "#";
  a.classList.add("dropdown-item");
  a.innerHTML = text;
  a.addEventListener('click', () => func());
  li.appendChild(a);
  ul.appendChild(li);
}

// Admin buttons
elements.restoreBtn.addEventListener('click', () => window.confirm("Are you sure you want to restore the VM?") && VM?.restore());
elements.rebootBtn.addEventListener('click', () => VM?.reboot());
elements.clearQueueBtn.addEventListener('click', () => VM?.clearQueue());
elements.bypassTurnBtn.addEventListener('click', () => VM?.bypassTurn());
elements.endTurnBtn.addEventListener('click', () => {
  var user = VM?.getUsers().find(u => u.turn === 0);
  if (user) VM?.endTurn(user.username);
});
elements.forceVoteNoBtn.addEventListener('click', () => VM?.forceVote(false));
elements.forceVoteYesBtn.addEventListener('click', () => VM?.forceVote(true));
elements.indefTurnBtn.addEventListener('click', () => VM?.indefiniteTurn());

async function sendQEMUCommand() {
  if (!elements.qemuMonitorInput.value) return;
  var cmd = elements.qemuMonitorInput.value;
  elements.qemuMonitorOutput.innerHTML += `&gt; ${cmd}\n`;
  elements.qemuMonitorInput.value = "";
  var response = await VM?.qemuMonitor(cmd);
  elements.qemuMonitorOutput.innerHTML += `${response}\n`;
  elements.qemuMonitorOutput.scrollTop = elements.qemuMonitorOutput.scrollHeight;
}
elements.qemuMonitorSendBtn.addEventListener('click', () => sendQEMUCommand());
elements.qemuMonitorInput.addEventListener('keypress', (e) => e.key === "Enter" && sendQEMUCommand());

elements.osk.addEventListener('click', () => elements.oskContainer.classList.toggle('d-none'));

// Public API
w.collabvm = {
    openVM: openVM,
    closeVM: closeVM,
    loadList: loadList,
    multicollab: multicollab,
    getVM: () => VM,
}
// Multicollab will stay in the global scope for backwards compatibility
w.multicollab = multicollab;
// Same goes for GetAdmin
w.GetAdmin = () => {
  if (VM === null) return;
  return {
    adminInstruction: (...args : string[]) => {
      args.unshift("admin");
      VM?.send(...args);
    },
    restore: () => VM!.restore(),
    reboot: () => VM!.reboot(),
    clearQueue: () => VM!.clearQueue(),
    bypassTurn: () => VM!.bypassTurn(),
    endTurn: (username : string) => VM!.endTurn(username),
    ban: (username : string) => VM!.ban(username),
    kick: (username : string) => VM!.kick(username),
    renameUser: (oldname : string, newname : string) => VM!.renameUser(oldname, newname),
    mute: (username : string, state : number) => VM!.mute(username, state),
    getip: (username : string) => VM!.getip(username),
    qemuMonitor: (cmd : string) => {VM?.qemuMonitor(cmd); return;},
    globalXss: (msg : string) => VM!.xss(msg),
    forceVote: (result : boolean) => VM!.forceVote(result),
  }
};
// more backwards compatibility
w.cvmEvents = {
  on: (event : string | number, cb: (...args: any) => void) => {
    if (VM === null) return;
    VM.on('message', (...args : any) => cb(...args));
  }
}
w.VMName = null;

// Load all VMs
loadList();

// Welcome modal
var noWelcomeModal = window.localStorage.getItem("no-welcome-modal");
if (noWelcomeModal !== "1") {
	var welcomeModalDismissBtn = document.getElementById("welcomeModalDismiss") as HTMLButtonElement;
	var welcomeModal = new bootstrap.Modal(document.getElementById("welcomeModal") as HTMLDivElement);
	welcomeModalDismissBtn.addEventListener("click", () => {
		window.localStorage.setItem("no-welcome-modal", "1");
	});
	welcomeModalDismissBtn.disabled = true;
	welcomeModal.show();
	setTimeout(() => {
		welcomeModalDismissBtn.disabled = false;
	}, 5000);
}