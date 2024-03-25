const elements = {
	changeUsernameDialog: document.querySelector('#changeUsernameDialog') as HTMLDialogElement
};

// returns a promise which will resolve with "null" for canceled,
// and a username for a username
export async function ChangeUsername_Modal(lastUsername: string): Promise<string | null> {
	return new Promise((res, rej) => {
		const usernameInput = elements.changeUsernameDialog.querySelector('#usernameInput') as HTMLInputElement;
		const cancelButton = elements.changeUsernameDialog.querySelector('#cancelButton') as HTMLButtonElement;
		const okButton = elements.changeUsernameDialog.querySelector('#okButton') as HTMLButtonElement;

		usernameInput.addEventListener('change', (e) => {
			okButton.value = usernameInput.value;
		});

		function handleDialog() {
			resetBox();
			res(elements.changeUsernameDialog.returnValue);
		}

		function handleDialogCancel() {
			resetBox();
			res(null);
		}

		function resetBox() {
			usernameInput.value = '';

			// remove event listener s you google..
			elements.changeUsernameDialog.removeEventListener('close', handleDialog);
			elements.changeUsernameDialog.removeEventListener('close', handleDialogCancel);
		}

		elements.changeUsernameDialog.addEventListener('cancel', (e) => {
			handleDialogCancel();
		});

		okButton.addEventListener('click', (ev) => {
			elements.changeUsernameDialog.addEventListener('close', handleDialog);
		});

		cancelButton.addEventListener('click', (ev) => {
			elements.changeUsernameDialog.addEventListener('close', handleDialogCancel);
		});

		// show the modal!
		usernameInput.value = lastUsername;
        okButton.value = lastUsername;
		elements.changeUsernameDialog.showModal();
	});
}
