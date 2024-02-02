import {createNanoEvents } from "nanoevents";
import * as Guacutils from './Guacutils.js';
import VM from "./VM.js";

export default class CollabVMClient {
    // Fields
    private socket : WebSocket;
    private canvas : HTMLCanvasElement;
    private ctx : CanvasRenderingContext2D;
    private url : string;
    // events that are used internally and not exposed
    private emitter;
    // public events
    private publicEmitter;

    constructor(url : string) {
        // Save the URL
        this.url = url;
        // Create the events
        this.emitter = createNanoEvents();
        this.publicEmitter = createNanoEvents();
        // Create the canvas
        this.canvas = document.createElement('canvas');
        // Set tab index so it can be focused
        this.canvas.tabIndex = -1;
        // Get the 2D context
        this.ctx = this.canvas.getContext('2d')!;
        // Create the WebSocket
        this.socket = new WebSocket(url, "guacamole");
        // Add the event listeners
        this.socket.addEventListener('open', () => this.onOpen());
        this.socket.addEventListener('message', (event) => this.onMessage(event));
    }

    // Fires when the WebSocket connection is opened
    private onOpen() {
        this.publicEmitter.emit('open');
    }

    // Fires on WebSocket message
    private onMessage(event : MessageEvent) {
        var msgArr : string[];
        try {
            msgArr = Guacutils.decode(event.data);
        } catch (e) {
            console.error(`Server sent invalid message (${e})`);
            return;
        }
        switch (msgArr[0]) {
            case "nop": {
                // Send a NOP back
                this.send("nop");
                break;
            }
            case "list": {
                // pass msgarr to the emitter for processing by list()
                console.log("got list")
                this.emitter.emit('list', msgArr.slice(1));
            }
        }
    }

    // Sends a message to the server
    send(...args : string[]) {
        this.socket.send(Guacutils.encode(...args));
    }

    // Get a list of all VMs
    list() : Promise<VM[]> {
        return new Promise((res, rej) => {
            var u = this.emitter.on('list', (list : string[]) => {
                u();
                var vms : VM[] = [];
                for (var i = 0; i < list.length; i += 3) {
                    var th = new Image();
                    th.src = "data:image/jpeg;base64," + list[i + 2];
                    vms.push({
                        url: this.url,
                        id: list[i],
                        displayName: list[i + 1],
                        thumbnail: th,
                    });
                    console.log("pushed", list[i]);
                }
                res(vms);
            });
            this.send("list");
        });
    }

    on = (event : string | number, cb: (...args: any) => void) => this.publicEmitter.on(event, cb);
}