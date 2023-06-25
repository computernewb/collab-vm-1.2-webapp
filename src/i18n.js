export default class i18n {
    lang;
    data;
    error;

    constructor(lang) {
        this.lang = lang;
    }

    async init() {
        return new Promise(async (resolve, reject) => {
            this.load(this.lang).then(res => {
                this.error = false;
                this.data = res;
                return resolve();
            }).catch(() => {
                this.error = true;
                alert(`i18n error: Failed to load language file for ${lang}. Alert a site administrator!`);
                return reject();
            });
        });
    }

    load(lang) {
        return new Promise(async (res, rej) => {
            await fetch(`translations/${lang}.json`).then(response => {
                if (!response.ok) { return rej(); }
                return res(response.json());
            });
        });
    }

    get(key) {

        // If we failed to load the translations earlier, return the original input.
        if (this.error) {
            return key;
        }

        const value = this.data[key];

        // If the translation does not exist in the currently loaded language, return the original input.
        if (!value) {
            return key;
        }

        return value;
    }

    change(lang) {
        if (this.lang == lang) return;

        this.load(lang).then(res => {
            this.lang = lang;
            this.data = res;
            this.replaceAllInDOM();
        }).catch((e) => {
            console.log(e);
            return alert(`i18n error: Failed to load language file for ${lang}. Alert a site administrator!`);
        });
    }

    replaceAllInDOM() {
        document.title = this.get("Control Collaborative Virtual Machines!");

        var elements = [
            { id: "homeText", key: "Home" },
            { id: "faqLink", key: "FAQ" },
            { id: "rulesLink", key: "Rules" },
            { id: "onlineUserText", key: "Users Online" },
            { id: "voteResetText", key: "Do you want to reset the vm?" },
            { id: "voteYesText", key: "Yes" },
            { id: "voteNoText", key: "No" },
            { id: "passVoteButtonText", key: "Pass Vote" },
            { id: "cancelVoteButtonText", key: "Cancel Vote" },
            { id: "takeTurnButtonText", key: "Take Turn" },
            { id: "changeUsernameButtonText", key: "Change Username" },
            { id: "voteResetButtonText", key: "Vote for Reset" },
            { id: "screenshotButtonText", key: "Screenshot" }
        ];               

        elements.forEach(el => {
            var element = document.getElementById(el.id);
            if (element != null) {
                element.innerText = ` ${this.get(el.key)}`;
            } else {
                console.warn(`${el.id} was null (would have assigned ${this.get(el.key)})`)
            }
        });
    }
}