export default class Mouse {
    left : boolean = false;
    middle : boolean = false;
    right : boolean = false;
    scrolldown : boolean = false;
    scrollup : boolean = false;
    x : number = 0;
    y : number = 0;
    constructor() {}

    makeMask() {
        var mask = 0;
        if (this.left) mask |= 1;
        if (this.middle) mask |= 2;
        if (this.right) mask |= 4;
        if (this.scrollup) mask |= 8;
        if (this.scrolldown) mask |= 16;
        return mask;
    }

    processEvent(e : MouseEvent, down : boolean | null = null) {
        if (down !== null) switch (e.button) {
            case 0:
                this.left = down;
                break;
            case 1:
                this.middle = down;
                break;
            case 2:
                this.right = down;
                break;
        }
        this.x = e.offsetX;
        this.y = e.offsetY;
    }
}