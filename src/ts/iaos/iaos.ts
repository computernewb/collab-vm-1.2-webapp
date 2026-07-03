import { I18n, I18nStringKey } from '../i18n';
import CollabVMClient from '../protocol/CollabVMClient';
import { IaosApi, IaosMediaEntry, IaosMediaList } from './api';
import { Offcanvas } from 'bootstrap';

const PLACEHOLDER_IMG_SRC = 'assets/img/disc_placeholder.svg';

const elements = {
	iaosDock: new Offcanvas(document.getElementById('iaosDock')!),
	iaosDockCardImg: document.getElementById('iaosDockCardImg') as HTMLImageElement,
	iaosDockCardTitle: document.getElementById('iaosDockCardTitle') as HTMLHeadingElement,
	iaosDockCardDesc: document.getElementById('iaosDockCardDesc') as HTMLParagraphElement,
	iaosDockTableBody: document.getElementById('iaosDockTableBody') as HTMLTableSectionElement,
	iaosTabContainer: document.getElementById('iaosTabContainer') as HTMLDivElement,
	iaosInsertBtn: document.getElementById('iaosInsertBtn') as HTMLButtonElement,
	iaosEjectBtn: document.getElementById('iaosEjectBtn') as HTMLButtonElement
};

export class IaosManager {
	private i18n: I18n;
	private media: IaosMediaList | null;
	private currentOpenMediaKind: string | null;
	private selectedEntry: IaosMediaEntry | null;
	private dockTabs: Map<string, HTMLDivElement>;
	private categories: Map<string, HTMLTableSectionElement>;
	private entryRows: Map<IaosMediaEntry, HTMLTableRowElement>;
	private VM: CollabVMClient | null;

	constructor(i18n: I18n) {
		this.i18n = i18n;
		this.media = null;
		this.currentOpenMediaKind = null;
		this.selectedEntry = null;
		this.dockTabs = new Map();
		this.categories = new Map();
		this.entryRows = new Map();
		this.VM = null;

		elements.iaosInsertBtn.addEventListener('click', () => this.onInsert());
		elements.iaosEjectBtn.addEventListener('click', () => this.onEject());
	}

	destroyIaosUi() {
		document.getElementById('vmview')!.classList.remove('iaos-vmview');
		elements.iaosTabContainer.replaceChildren();
		this.dockTabs.clear();
		this.resetDock();
		this.VM = null;
	}

	async initIaos(apiBase: string, mediaKindSupported: Array<string>, VM: CollabVMClient) {
		this.destroyIaosUi();
		let api = new IaosApi(apiBase);
		this.VM = VM;

		// get the media list
		this.media = await api.getMediaList();

		document.getElementById('vmview')!.classList.add('iaos-vmview');
		// create dock tabs
		for (let kind of mediaKindSupported) {
			let dockTab = document.createElement('div');
			dockTab.classList.add(`iaos-dock-tab-${kind}`, 'iaos-dock-tab');

			dockTab.addEventListener('click', () => {
				this.toggleDockTab(kind);
			});

			let dockTabP = document.createElement('p');
			dockTabP.classList.add(`iaos-dock-tab-label-${kind}`);

			dockTab.appendChild(dockTabP);
			elements.iaosTabContainer.appendChild(dockTab);

			this.i18n.LocalizeClassNames(`iaos-dock-tab-label-${kind}`);
			this.dockTabs.set(kind, dockTab);
		}
	}

	private resetDock() {
		elements.iaosDockCardImg.src = PLACEHOLDER_IMG_SRC;
		elements.iaosDockCardTitle.replaceChildren();
		elements.iaosDockCardDesc.replaceChildren();
		elements.iaosDockTableBody.replaceChildren();
		for (let tab of this.dockTabs.values()) {
			tab.classList.remove('iaos-active');
		}
		this.categories.clear();
		this.entryRows.clear();
		this.selectedEntry = null;
		elements.iaosInsertBtn.disabled = true;
	}

	private populateDock(mediaKind: string) {
		this.dockTabs.get(mediaKind)?.classList.add('iaos-active');
		for (let entry of this.media!.media.filter((m) => m.kind === mediaKind)) {
			let categorySection = this.categories.get(entry.category);
			if (!categorySection) {
				let category = this.media!.categories[entry.category];
				// create category header
				let headerTr = document.createElement('tr');
				let headerTd = document.createElement('td');
				headerTd.classList.add('iaos-media-category-header');
				headerTd.innerText = category.name;
				headerTr.appendChild(headerTd);
				// create category section
				let sectionTr = document.createElement('tr');
				let sectionTd = document.createElement('td');
				let sectionTable = document.createElement('table');
				sectionTable.classList.add('table', 'table-striped', 'table-hover', 'mb-0');
				sectionTable.insertAdjacentHTML('afterbegin', '<colgroup><col span="1" class="iaos-media-name-col"/><col span="1" class="iaos-media-year-col" /></colgroup>');
				let sectionTableBody = document.createElement('tbody');
				sectionTable.appendChild(sectionTableBody);
				sectionTd.appendChild(sectionTable);
				sectionTr.appendChild(sectionTd);

				elements.iaosDockTableBody.appendChild(headerTr);
				elements.iaosDockTableBody.appendChild(sectionTr);
				categorySection = sectionTableBody;
				this.categories.set(entry.category, categorySection);
			}

			let entryTr = document.createElement('tr');
			entryTr.classList.add('iaos-media-entry-row');
			entryTr.addEventListener('click', () => this.highlightEntry(entry));

			let entryName = document.createElement('td');
			entryName.classList.add('iaos-media-entry-name');
			entryName.innerText = entry.name;
			entryTr.appendChild(entryName);

			let entryYear = document.createElement('td');
			entryYear.classList.add('iaos-media-entry-year');
			entryYear.innerText = entry.year ?? '';
			entryTr.appendChild(entryYear);

			categorySection.appendChild(entryTr);
			this.entryRows.set(entry, entryTr);
		}
	}

	private highlightEntry(entry: IaosMediaEntry) {
		if (this.selectedEntry) {
			this.entryRows.get(this.selectedEntry)?.classList.remove('table-active');
		}
		this.selectedEntry = entry;
		this.entryRows.get(entry)?.classList.add('table-active');

		elements.iaosDockCardImg.src = entry.image_url ?? PLACEHOLDER_IMG_SRC;
		elements.iaosDockCardTitle.innerText = entry.name;
		elements.iaosDockCardDesc.innerText = entry.description ?? '';
		elements.iaosInsertBtn.disabled = false;
	}

	private hideDock() {
		this.currentOpenMediaKind = null;
		elements.iaosDock.hide();
		this.resetDock();
	}

	private toggleDockTab(mediaKind: string) {
		this.resetDock();
		if (this.currentOpenMediaKind === null) {
			this.currentOpenMediaKind = mediaKind;
			this.populateDock(mediaKind);
			elements.iaosDock.show();
		} else if (this.currentOpenMediaKind === mediaKind) {
			elements.iaosDock.hide();
			this.currentOpenMediaKind = null;
		} else {
			this.currentOpenMediaKind = mediaKind;
			this.populateDock(mediaKind);
		}
	}

	private onInsert() {
		if (!this.selectedEntry || !this.VM) {
			return;
		}

		this.VM.insertMedia(this.selectedEntry.id);
		this.hideDock();
	}

	private onEject() {
		if (!this.currentOpenMediaKind || !this.VM) {
			return;
		}

		this.VM.ejectMedia(this.currentOpenMediaKind);
		this.hideDock();
	}
}
