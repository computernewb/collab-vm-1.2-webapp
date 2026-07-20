// i couldnt find an official typing for this, if one exists that should be used instead
export default (window as any).FontAwesome as {
	icon(c: { prefix: string; iconName: string }): {
		html: Array<string>;
		icon: Array<any>;
		iconName: string;
		node: HTMLCollection;
		prefix: string;
		type: string;
	};
};
