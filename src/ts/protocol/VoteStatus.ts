export interface VoteStatusEvent {
	voteType: string;
	voteIntentStr: string;
	voteTime: number;
	started: boolean;
	startedByUser: string | null;
	yesVotes: Array<string> | null;
	noVotes: Array<string> | null;
	yesCount: number;
	noCount: number;
	data?: any;
}

export interface VoteEndedEvent {
	voteType: string;
	voteIntentStr: string;
	voteSucceeded: boolean | null;
}
