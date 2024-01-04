export const config = {
    serverAddresses: [
        "wss://computernewb.com/collab-vm/vm0",
        "wss://computernewb.com/collab-vm/vm1",
        "wss://computernewb.com/collab-vm/vm2",
        "wss://computernewb.com/collab-vm/vm3",
        "wss://computernewb.com/collab-vm/vm4",
        "wss://computernewb.com/collab-vm/vm5",
        "wss://computernewb.com/collab-vm/vm6",
        "wss://computernewb.com/collab-vm/vm7",
        "wss://computernewb.com/collab-vm/vm8",
	"wss://computernewb.com/collab-vm/vm9",
	"wss://computernewb.com/collab-vm/eventvm",
    ],
    chatSound: "https://computernewb.com/collab-vm/notify.ogg",
    // What XSS implementation the server uses
    // 0: No XSS (cvm1.2.11)
    // 1: Internal fork style (cvm1.ts, global opcode 21)
    // 2: yellows111/collab-vm-server style (per-user opcode 21)
    xssImplementation: 1,
}
