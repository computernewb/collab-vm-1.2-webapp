import { I18n } from '../i18n';
import CollabVMClient from '../protocol/CollabVMClient';
import { IaosApi, IaosMediaEntry, IaosMediaList } from './api';
import { Modal } from 'bootstrap';

const PLACEHOLDER_IMG_SRC = 'assets/img/disc_placeholder.svg';

const elements = {
	iaosModal: document.getElementById('iaosModal') as HTMLDivElement,
	iaosDockCardImg: document.getElementById('iaosDockCardImg') as HTMLImageElement,
	iaosDockCardTitle: document.getElementById('iaosDockCardTitle') as HTMLHeadingElement,
	iaosDockCardDesc: document.getElementById('iaosDockCardDesc') as HTMLParagraphElement,
	iaosInsertBtn: document.getElementById('iaosInsertBtn') as HTMLButtonElement,
	iaosEjectBtn: document.getElementById('iaosEjectBtn') as HTMLButtonElement,
	iaosTabList: document.getElementById('iaosTabList') as HTMLUListElement,
	iaosTabContent: document.getElementById('iaosTabContent') as HTMLDivElement,
	changeMediaBtn: document.getElementById('changeMediaBtn') as HTMLButtonElement
};

type ModalTab = {
	kind: string;
	tabLi: HTMLLIElement;
	tabButton: HTMLButtonElement;
	tabContent: HTMLDivElement;
	tableBody: HTMLTableSectionElement;
	categories: Map<string, HTMLTableSectionElement>;
	entryRows: Map<IaosMediaEntry, HTMLTableRowElement>;
};

export class IaosManager {
	private modal: Modal | null;
	private i18n: I18n;
	private media: IaosMediaList | null;
	private currentOpenTab: ModalTab | null;
	private selectedEntry: IaosMediaEntry | null;
	private modalTabs: Map<string, ModalTab>;
	private VM: CollabVMClient | null;

	constructor(i18n: I18n) {
		this.i18n = i18n;
		this.media = null;
		this.currentOpenTab = null;
		this.selectedEntry = null;
		this.modalTabs = new Map();
		this.VM = null;
		this.modal = null;

		elements.iaosInsertBtn.addEventListener('click', () => this.onInsert());
		elements.iaosEjectBtn.addEventListener('click', () => this.onEject());
	}

	destroyIaosUi() {
		document.getElementById('vmview')!.classList.remove('iaos-vmview');
		elements.iaosTabList.replaceChildren();
		elements.iaosTabContent.replaceChildren();
		this.modalTabs.clear();
		elements.iaosDockCardImg.src = PLACEHOLDER_IMG_SRC;
		elements.iaosDockCardTitle.replaceChildren();
		elements.iaosDockCardDesc.replaceChildren();
		elements.iaosInsertBtn.disabled = true;
		this.selectedEntry = null;
		this.VM = null;
		elements.changeMediaBtn.classList.add('d-none');
	}

	async initIaos(apiBase: string, mediaKindSupported: Array<string>, VM: CollabVMClient) {
		this.destroyIaosUi();
		this.modal = new Modal(elements.iaosModal, { backdrop: true });
		let api = new IaosApi(apiBase);
		this.VM = VM;

		// get the media list
		this.media = await api.getMediaList();

		document.getElementById('vmview')!.classList.add('iaos-vmview');

		// create tabs
		for (let kind of mediaKindSupported) {
			let tabLi = document.createElement('li');
			tabLi.classList.add('nav-item');
			tabLi.setAttribute('role', 'presentation');

			let tabButton = document.createElement('button');
			tabButton.classList.add('nav-link', `iaos-tab-label-${kind}`);
			tabButton.type = 'button';
			tabButton.setAttribute('role', 'tab');
			tabLi.appendChild(tabButton);
			elements.iaosTabList.appendChild(tabLi);

			let tabContent = document.createElement('div');
			tabContent.classList.add('tab-pane', 'iaos-tab-pane');
			let table = document.createElement('table');
			table.classList.add('table', 'table-bordered', 'm-0');
			let tableBody = document.createElement('tbody');
			table.appendChild(tableBody);
			tabContent.appendChild(table);
			elements.iaosTabContent.appendChild(tabContent);

			tabButton.addEventListener('click', () => {
				this.selectTab(kind);
			});

			this.modalTabs.set(kind, {
				kind,
				tabLi,
				tabButton,
				tabContent,
				tableBody,
				categories: new Map(),
				entryRows: new Map()
			});

			this.populateDock(kind);
		}

		this.i18n.LocalizeClassNames(...mediaKindSupported.map((kind) => `iaos-tab-label-${kind}`));
		this.selectTab(this.modalTabs.get(mediaKindSupported[0])!.kind);
		elements.changeMediaBtn.classList.remove('d-none');
	}

	private populateDock(mediaKind: string) {
		let tab = this.modalTabs.get(mediaKind)!;

		for (let entry of this.media!.media.filter((m) => m.kind === mediaKind)) {
			let categorySection = tab.categories.get(entry.category);
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

				tab.tableBody.appendChild(headerTr);
				tab.tableBody.appendChild(sectionTr);
				categorySection = sectionTableBody;
				tab.categories.set(entry.category, categorySection);
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
			tab.entryRows.set(entry, entryTr);
		}
	}

	private highlightEntry(entry: IaosMediaEntry | null) {
		if (!this.currentOpenTab) return;

		if (this.selectedEntry) {
			this.currentOpenTab.entryRows.get(this.selectedEntry)?.classList.remove('table-active');
		}

		this.selectedEntry = entry;

		if (!entry) {
			elements.iaosDockCardImg.src = PLACEHOLDER_IMG_SRC;
			elements.iaosDockCardTitle.replaceChildren();
			elements.iaosDockCardDesc.replaceChildren();
			elements.iaosInsertBtn.disabled = true;
			return;
		}

		this.currentOpenTab.entryRows.get(entry)?.classList.add('table-active');

		elements.iaosDockCardImg.src = entry.image_url ?? PLACEHOLDER_IMG_SRC;
		elements.iaosDockCardTitle.innerText = entry.name;
		elements.iaosDockCardDesc.innerText = entry.description ?? '';
		elements.iaosInsertBtn.disabled = false;
	}

	private selectTab(mediaKind: string) {
		if (this.currentOpenTab) {
			this.currentOpenTab.tabButton.classList.remove('active');
			this.currentOpenTab.tabContent.classList.remove('active');
		}

		if (this.selectedEntry) {
			this.highlightEntry(null);
		}

		let tab = this.modalTabs.get(mediaKind)!;
		tab.tabButton.classList.add('active');
		tab.tabContent.classList.add('active');
		this.currentOpenTab = tab;
	}

	private onInsert() {
		if (!this.selectedEntry || !this.VM) {
			return;
		}

		this.VM.insertMedia(this.selectedEntry.id);
		this.modal?.hide();
	}

	private onEject() {
		if (!this.currentOpenTab || !this.VM) {
			return;
		}

		this.VM.ejectMedia(this.currentOpenTab.kind);
		this.modal?.hide();
	}
}
