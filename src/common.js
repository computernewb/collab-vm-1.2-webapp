export const config = {
    serverAddresses: [
        "ws://127.0.0.1:6004",
    ],
    chatSound: "https://computernewb.com/collab-vm/notify.ogg",
    // What XSS implementation the server uses
    // 0: No XSS (If you're using upstream it will be this)
    // 1: Internal fork style (main vms only, global opcode 21)
    // 2: yellows111/collab-vm-server style (per-user opcode 21)
    xssImplementation: 1,
}