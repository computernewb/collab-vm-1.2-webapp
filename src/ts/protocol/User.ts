import { Rank } from './Permissions.js';

export class User {
	username: string;
	rank: Rank;
	// -1 means not in the turn queue, 0 means the current turn, anything else is the position in the queue
	turn: number;

	constructor(username: string, rank: Rank = Rank.Unregistered) {
		this.username = username;
		this.rank = rank;
		this.turn = -1;
	}
}
