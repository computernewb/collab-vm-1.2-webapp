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
    ],
    chatSound: "https://computernewb.com/collab-vm/notify.ogg",
    // What XSS implementation the server uses
    // 0: No XSS (If you're using upstream it will be this)
    // 1: Internal fork style (main vms only, global opcode 21)
    // 2: yellows111/collab-vm-server style (per-user opcode 21)
    xssImplementation: 1,
}