import CollabVMClient from "./protocol/CollabVMClient.js";
import VM from "./protocol/VM.js";
import { Config } from "../../Config.js";
import { Rank } from "./protocol/Permissions.js";
import { User } from "./protocol/User.js";

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
}
// Listed VMs
const vms : VM[] = [];
const cards : HTMLDivElement[] = [];

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
            cardBody.appendChild(cardTitle);
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
            switch (status) {
                case 'taken': alert("That username is already taken"); break;
                case 'invalid': alert("Usernames can contain only numbers, letters, spaces, dashes, underscores, and dots, and it must be between 3 and 20 characters."); break;
                case 'blacklisted': alert("That username has been blacklisted."); break;
            }
        });
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
    // Close the VM
    VM.close();
    VM = null;
    // Remove the canvas
    elements.vmDisplay.innerHTML = "";
    // Switch to the VM list
    elements.vmlist.style.display = "block";
    elements.vmview.style.display = "none";
    // Clear users
    elements.userlist.innerHTML = "";
}

function loadList() {
    return new Promise<void>(async res => {
        var p = [];
        for (var url of Config.ServerAddresses) {
            p.push(multicollab(url));
        }
        await Promise.all(p);
        var v = vms.find(v => v.id === window.location.hash.slice(1));
        if (v !== undefined) openVM(v);
        res();
    });
}

function sortVMList() {
    cards.sort(function(a, b) {
        return a.children[0].getAttribute("data-cvm-node")! > b.id ? 1 : -1;
    });
    elements.vmlist.children[0].innerHTML = "";
    cards.forEach((c) => elements.vmlist.children[0].appendChild(c));
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
                userclass = "user-unregistered";
                msgclass = "chat-unregistered";
                break;
            case Rank.Admin:
                userclass = "user-admin";
                msgclass = "chat-admin";
                break;
            case Rank.Moderator:
                userclass = "user-mod";
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
    var olduser = Array.prototype.slice.call(elements.userlist.children).find((u : HTMLTableRowElement) => u.children[0].innerHTML === user.username);
    if (olduser !== undefined) elements.userlist.removeChild(olduser);
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.innerHTML = user.username;
    switch (user.rank) {
        case Rank.Admin:
            td.classList.add("user-admin");
            break;
        case Rank.Moderator:
            td.classList.add("user-moderator");
            break;
        case Rank.Unregistered:
            td.classList.add("user-unregistered");
            break;
    }
    tr.appendChild(td);
    elements.userlist.appendChild(tr);
    elements.onlineusercount.innerHTML = VM!.getUsers().length.toString();
}

function remUser(user : User) {
    var olduser = Array.prototype.slice.call(elements.userlist.children).find((u : HTMLTableRowElement) => u.children[0].innerHTML === user.username);
    if (olduser !== undefined) elements.userlist.removeChild(olduser);
    elements.onlineusercount.innerHTML = VM!.getUsers().length.toString();
}

function userRenamed(oldname : string, newname : string, selfrename : boolean) {
    var user = Array.prototype.slice.call(elements.userlist.children).find((u : HTMLTableRowElement) => u.children[0].innerHTML === oldname);
    if (user) {
        user.children[0].innerHTML = newname;
    }
    if (selfrename) {
        w.username = newname;
        elements.username.innerText = newname;
        localStorage.setItem("username", newname);
    }
}

// Bind list buttons
elements.homeBtn.addEventListener('click', () => closeVM());

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
