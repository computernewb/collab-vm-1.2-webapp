const elements = {
	alertDialog: document.querySelector('#alertDialog') as HTMLDialogElement
};

export function Alert_Modal(text: string) {
	const alertMessage = elements.alertDialog.querySelector('#alertMessage') as HTMLLabelElement;
	alertMessage.innerText = text;
	elements.alertDialog.showModal();
}
