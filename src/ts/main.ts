import CollabVMClient from "./protocol/CollabVMClient.js";
import VM from "./protocol/VM.js";
import { Config } from "../../Config.js";
import { Rank } from "./protocol/Permissions.js";
import { User } from "./protocol/User.js";
import TurnStatus from "./protocol/TurnStatus.js";
import Keyboard from "simple-keyboard";
import { OSK_buttonToKeysym } from "./keyboard";
import "simple-keyboard/build/css/index.css";

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
    oskContainer: document.getElementById("osk-container") as HTMLDivElement
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
var turnInterval : number | undefined = undefined;;
var turnTimer = 0;

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
        listeners.push(VM!.on('close', () => {
            if (!expectedClose) alert("You have been disconnected from the server");
            for (var l of listeners) l();
            closeVM();
        }));
        // Wait for the client to open
        await new Promise<void>(res => VM!.on('open', () => res()));
        // Connect to node
        chatMessage("", vm.id);
        var connected = await VM.connect(vm.id);
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
        return a.getAttribute("data-cvm-node")! > b.getAttribute("data-cvm-node")! ? 1 : -1;
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
        tr.appendChild(td);
        elements.chatList.appendChild(tr);
        elements.chatListDiv.scrollTop = elements.chatListDiv.scrollHeight;
    }
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
    elements.userlist.appendChild(tr);
    if (olduser !== undefined) olduser.element = tr;
    else users.push({user: user, element: tr});
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
    VM.chat(elements.chatinput.value);
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

elements.osk.addEventListener('click', () => elements.oskContainer.classList.toggle('d-none'));

// Public API
w.collabvm = {
    openVM: openVM,
    closeVM: closeVM,
    loadList: loadList,
    multicollab: multicollab
}
// Multicollab will stay in the global scope for backwards compatibility
w.multicollab = multicollab;
// Same goes for GetAdmin
// w.GetAdmin = () => VM.admin;

// Load all VMs
loadList();
