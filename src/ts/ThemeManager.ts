export class ThemeManager {
    isDarkTheme: boolean;

    constructor() {
        // Check if dark theme is set in local storage
        if (localStorage.getItem("cvm-dark-theme") !== null)
            this.isDarkTheme = localStorage.getItem("cvm-dark-theme") === "1";
        // Otherwise, try to detect the system theme
        else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
            this.isDarkTheme = true;
        else
            this.isDarkTheme = false;

        this.setDarkTheme(this.isDarkTheme);
    }

    setDarkTheme(dark: boolean) {
        this.isDarkTheme = dark;
        document.children[0].setAttribute("data-bs-theme", this.isDarkTheme ? "dark" : "light");
        localStorage.setItem("cvm-dark-theme", this.isDarkTheme ? "1" : "0");
    }

    toggleTheme() {
        this.setDarkTheme(!this.isDarkTheme);
    }
}