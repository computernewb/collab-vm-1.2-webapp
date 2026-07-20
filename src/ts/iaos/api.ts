export type IaosMediaEntry = {
	id: string;
	kind: string;
	category: string;
	name: string;
	description: string | null;
	year: string | null;
	image_url: string | null;
	build_number: string | null;
	architecture: string | null;
};

export type IaosMediaCategory = { name: string };

export type IaosMediaList = {
	categories: { [id: string]: IaosMediaCategory };
	media: Array<IaosMediaEntry>;
};

export class IaosApi {
	private apiBase: string;
	constructor(apiBase: string) {
		this.apiBase = apiBase;
	}

	async getMediaList() {
		let res = await fetch(`${this.apiBase}/iaos/media`);

		if (!res.ok) {
			throw new Error(`media api returned ${res.status}`);
		}

		return (await res.json()) as IaosMediaList;
	}
}
