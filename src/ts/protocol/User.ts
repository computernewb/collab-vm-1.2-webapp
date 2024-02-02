import { Rank } from "./Permissions.js";

export class User {
    username : string;
    rank : Rank

    constructor(username : string, rank : Rank = Rank.Unregistered) {
        this.username = username;
        this.rank = rank;
    }
}