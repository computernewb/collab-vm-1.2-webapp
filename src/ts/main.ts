import CollabVMClient from "./protocol/CollabVMClient.js";
import VM from "./protocol/VM.js";
import { Config } from "../../Config.js";

// Elements
const elements = {
    vmlist: document.getElementById('vmlist') as HTMLDivElement,
}
// Listed VMs
const vms : VM[] = [];

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
            elements.vmlist.children[0].appendChild(div);
            reloadVMList();
        }
        res();
    });
}
function openVM(vm : VM) {

}

function reloadVMList() {
    var cards = Array.prototype.slice.call(elements.vmlist.children[0].children);
    cards.sort(function(a, b) {
        return a.id > b.id ? 1 : -1;
    });
    elements.vmlist.children[0].innerHTML = "";
    cards.forEach((c) => elements.vmlist.children[0].appendChild(c));
}

// Public API
var w = window as any;
w.multicollab = multicollab;
w.openVM = openVM;

// Load all VMs
for (var url of Config.ServerAddresses) {
    multicollab(url);
}