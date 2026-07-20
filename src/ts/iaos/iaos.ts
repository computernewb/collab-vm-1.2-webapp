import { I18n } from '../i18n';
import CollabVMClient from '../protocol/CollabVMClient';
import { IaosApi, IaosMediaEntry, IaosMediaList } from './api';
import { Collapse, Modal } from 'bootstrap';
import fa from '../fontawesome.js';

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
	changeMediaBtn: document.getElementById('changeMediaBtn') as HTMLButtonElement,
	iaosTableFilter: document.getElementById('iaosTableFilter') as HTMLInputElement
};

const MEDIA_TABLE_COLGROUP =
	'<colgroup><col span="1" class="iaos-media-name-col"/><col span="1" class="iaos-media-build-col"/><col span="1" class="iaos-media-arch-col"/><col span="1" class="iaos-media-year-col"/><col span="1" class="iaos-collapse-marker-col"/></colgroup>';

type ModalTab = {
	kind: string;
	tabLi: HTMLLIElement;
	tabButton: HTMLButtonElement;
	tabContent: HTMLDivElement;
	tableBody: HTMLTableSectionElement;
	categories: Map<string, CategorySection>;
	entryRows: Map<IaosMediaEntry, HTMLTableRowElement>;
};

type CategorySection = {
	headerRow: HTMLTableRowElement;
	tableRow: HTMLTableRowElement;
	tableDiv: HTMLDivElement;
	table: HTMLTableElement;
	tableBody: HTMLTableSectionElement;
};

export class IaosManager {
	private modal: Modal | null;
	private i18n: I18n;
	private media: IaosMediaList | null;
	private currentOpenTab: ModalTab | null;
	private selectedEntry: IaosMediaEntry | null;
	private modalTabs: Map<string, ModalTab>;
	private VM: CollabVMClient | null;
	private filterInputHandler = (ev: InputEvent) => this.onFilterInput();

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
		elements.iaosTableFilter.removeEventListener('input', this.filterInputHandler);
		elements.iaosTableFilter.value = '';
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
			table.classList.add('iaos-category-table', 'table', 'table-bordered', 'm-0');
			table.insertAdjacentHTML('afterbegin', MEDIA_TABLE_COLGROUP);
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

		elements.iaosTableFilter.addEventListener('input', this.filterInputHandler);

		this.i18n.LocalizeClassNames(...mediaKindSupported.map((kind) => `iaos-tab-label-${kind}`), 'iaos-media-build-header', 'iaos-media-arch-header', 'iaos-media-year-header');
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
				headerTr.classList.add('iaos-category-header-row');
				let headerTh = document.createElement('th');
				headerTh.classList.add('iaos-media-category-header');
				headerTh.innerText = category.name;
				headerTr.appendChild(headerTh);
				headerTr.insertAdjacentHTML('beforeend', '<th class="iaos-media-build-header"></th><th class="iaos-media-arch-header"></th><th class="iaos-media-year-header"></th>');

				let collapseMarker = document.createElement('th');
				collapseMarker.classList.add('iaos-category-collapse-marker');
				collapseMarker.replaceChildren(...fa.icon({ prefix: 'fas', iconName: 'caret-down' }).node);
				collapseMarker.setAttribute('aria-expanded', 'true');
				headerTr.appendChild(collapseMarker);

				// create category section
				let sectionTr = document.createElement('tr');
				sectionTr.classList.add('iaos-category-entries-row');
				let sectionTd = document.createElement('td');
				sectionTd.colSpan = 5;
				// two divs are needed for the transition to look correct
				let sectionDiv = document.createElement('div');
				sectionDiv.classList.add('iaos-entry-table-container-outer');
				let sectionDivInner = document.createElement('div');
				sectionDivInner.classList.add('iaos-entry-table-container-inner');

				let sectionTable = document.createElement('table');
				sectionTable.classList.add('iaos-entry-table', 'table', 'table-striped', 'table-hover', 'mb-0');
				sectionTable.insertAdjacentHTML('afterbegin', MEDIA_TABLE_COLGROUP);
				let sectionTableBody = document.createElement('tbody');
				sectionTable.appendChild(sectionTableBody);
				sectionDivInner.appendChild(sectionTable);
				sectionDiv.appendChild(sectionDivInner);
				sectionTd.appendChild(sectionDiv);
				sectionTr.appendChild(sectionTd);

				// collapse functionality
				let collapse = new Collapse(sectionDiv, { toggle: true });
				sectionDiv.addEventListener('show.bs.collapse', () => collapseMarker.setAttribute('aria-expanded', 'true'));
				sectionDiv.addEventListener('hide.bs.collapse', () => collapseMarker.setAttribute('aria-expanded', 'false'));
				headerTr.addEventListener('click', () => collapse.toggle());

				tab.tableBody.appendChild(headerTr);
				tab.tableBody.appendChild(sectionTr);
				categorySection = { headerRow: headerTr, tableRow: sectionTr, tableDiv: sectionDiv, table: sectionTable, tableBody: sectionTableBody };
				tab.categories.set(entry.category, categorySection);
			}

			let entryTr = document.createElement('tr');
			entryTr.classList.add('iaos-media-entry-row');
			entryTr.addEventListener('click', () => this.highlightEntry(entry));

			let entryName = document.createElement('td');
			entryName.classList.add('iaos-media-entry-name');
			entryName.innerText = entry.name;
			entryTr.appendChild(entryName);

			let entryBuild = document.createElement('td');
			entryBuild.classList.add('iaos-media-entry-build');
			entryBuild.innerText = entry.build_number ?? '';
			entryTr.appendChild(entryBuild);

			let entryArch = document.createElement('td');
			entryArch.classList.add('iaos-media-entry-arch');
			entryArch.innerText = entry.architecture ?? '';
			entryTr.appendChild(entryArch);

			let entryYear = document.createElement('td');
			entryYear.classList.add('iaos-media-entry-year');
			entryYear.innerText = entry.year ?? '';
			entryTr.appendChild(entryYear);

			// empty td so row extends full width
			entryTr.appendChild(document.createElement('td'));

			categorySection.tableBody.appendChild(entryTr);
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
			this.clearFilter();
		}

		if (this.selectedEntry) {
			this.highlightEntry(null);
		}

		let tab = this.modalTabs.get(mediaKind)!;
		tab.tabButton.classList.add('active');
		tab.tabContent.classList.add('active');
		this.currentOpenTab = tab;
		this.onFilterInput();
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

	private onFilterInput() {
		if (elements.iaosTableFilter.value.length > 0) {
			this.filterEntries(elements.iaosTableFilter.value);
		} else {
			this.clearFilter();
		}
	}

	private filterEntries(filter: string) {
		if (!this.currentOpenTab) {
			return;
		}

		this.clearFilter();
		filter = filter.toLowerCase();

		let categoryHasResults: { [category: string]: boolean } = {};

		for (let [entry, entryEl] of this.currentOpenTab.entryRows.entries()) {
			if (entry.name.toLowerCase().includes(filter)) {
				entryEl.classList.add('iaos-filter-match');
				categoryHasResults[entry.category] = true;
			} else {
				entryEl.classList.add('iaos-filter-no-match');
			}
		}

		for (let [cat, catSect] of this.currentOpenTab.categories.entries()) {
			if (categoryHasResults[cat]) {
				catSect.headerRow.classList.add('iaos-filter-match');
				catSect.tableRow.classList.add('iaos-filter-match');
			} else {
				catSect.headerRow.classList.add('iaos-filter-no-match');
				catSect.tableRow.classList.add('iaos-filter-no-match');
			}
		}
	}

	private clearFilter() {
		for (let tab of this.modalTabs.values()) {
			for (let cat of tab.categories.values()) {
				cat.headerRow.classList.remove('iaos-filter-match', 'iaos-filter-no-match');
				cat.tableRow.classList.remove('iaos-filter-match', 'iaos-filter-no-match');
			}
			for (let entry of tab.entryRows.values()) {
				entry.classList.remove('iaos-filter-match', 'iaos-filter-no-match');
			}
		}
	}

	show() {
		this.modal?.show();
	}

	hide() {
		this.modal?.hide();
	}
}
