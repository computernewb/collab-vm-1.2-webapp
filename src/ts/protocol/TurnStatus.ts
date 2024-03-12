import { User } from './User.js';

export default interface TurnStatus {
	// The user currently taking their turn
	user: User | null;
	// The users in the turn queue
	queue: User[];
	// Amount of time left in the turn. Null unless the user is taking their turn
	turnTime: number | null;
	// Amount of time until the user gets their turn. Null unless the user is in the queue
	queueTime: number | null;
}
