import * as dayjs from 'dayjs';

export default class AuthManager {
    apiEndpoint : string;
    info : AuthServerInformation | null;
    account : Account | null;
    constructor(apiEndpoint : string) {
        this.apiEndpoint = apiEndpoint;
        this.info = null;
        this.account = null;
    }

    getAPIInformation() : Promise<AuthServerInformation> {
        return new Promise(async res => {
            var data = await fetch(this.apiEndpoint + "/api/v1/info");
            this.info = await data.json();
            res(this.info!);
        })
    }

    login(username : string, password : string, captchaToken : string | undefined) : Promise<AccountLoginResult> {
        return new Promise(async (res,rej) => {
            if (!this.info) throw new Error("Cannot login before fetching API information.");
            if (!captchaToken && this.info.hcaptcha.required) throw new Error("This API requires a valid hCaptcha token.");
            var data = await fetch(this.apiEndpoint + "/api/v1/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    captchaToken: captchaToken
                })
            });
            var json = await data.json() as AccountLoginResult;
            if (!json) throw new Error("data.json() gave null or undefined result");
            if (json.success && !json.verificationRequired) {
                this.account = {
                    username: json.username!,
                    email: json.email!,
                    sessionToken: json.token!
                }
            }
            res(json);
        })
    }

    loadSession(token : string) {
        return new Promise<SessionResult>(async (res, rej) => {
            var data = await fetch(this.apiEndpoint + "/api/v1/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: token,
                })
            });
            var json = await data.json() as SessionResult;
            if (json.success) {
                this.account = {
                    sessionToken: token,
                    username: json.username!,
                    email: json.email!,
                };
            }
            res(json);
        })
    }

    register(username : string, password : string, email : string, dateOfBirth : dayjs.Dayjs, captchaToken : string | undefined) : Promise<AccountRegisterResult> {
        return new Promise(async (res, rej) => {
            if (!this.info) throw new Error("Cannot login before fetching API information.");
            if (!captchaToken && this.info.hcaptcha.required) throw new Error("This API requires a valid hCaptcha token.");
            var data = await fetch(this.apiEndpoint + "/api/v1/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    email: email,
                    dateOfBirth: dateOfBirth.format("YYYY-MM-DD"),
                    captchatoken: captchaToken
                })
            });
            res(await data.json() as AccountRegisterResult);
        });
    }

    logout() {
        return new Promise<LogoutResult>(async res => {
            if (!this.account) throw new Error("Cannot log out without logging in first");
            var data = await fetch(this.apiEndpoint + "/api/v1/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: this.account.sessionToken
                })
            });
            var json = await data.json() as LogoutResult;
            this.account = null;
            res(json);
        })
    }

    verifyEmail(username : string, password : string, code : string) {
        return new Promise<VerifyEmailResult>(async res => {
            var data = await fetch(this.apiEndpoint + "/api/v1/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    code: code,
                })
            });
            res(await data.json() as VerifyEmailResult);
        });
    }

    updateAccount(currentPassword : string, newEmail : string | undefined, newUsername : string | undefined, newPassword : string | undefined) {
        return new Promise<UpdateAccountResult>(async res => {
            if (!this.account) throw new Error("Cannot update account without being logged in.");
            if (!newEmail && !newUsername && !newPassword) throw new Error("Cannot update account without any new information.");
            var data = await fetch(this.apiEndpoint + "/api/v1/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: this.account!.sessionToken,
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                    username: newUsername,
                    email: newEmail,
                })
            });
            var json = await data.json() as UpdateAccountResult;
            if (json.success) {
                if (this.account!.email !== newEmail) this.account!.email = newEmail!;
                if (this.account!.username !== newUsername) this.account!.username = newUsername!;
                if (json.sessionExpired || json.verificationRequired) {
                    this.account = null;
                }
            }
            res(json);
        });
    }

    sendPasswordResetEmail(username : string, email : string, captchaToken : string | undefined) {
        return new Promise<PasswordResetResult>(async res => {
            if (!this.info) throw new Error("Cannot send password reset email without fetching API information.");
            if (!captchaToken && this.info.hcaptcha.required) throw new Error("This API requires a valid hCaptcha token.");
            var data = await fetch(this.apiEndpoint + "/api/v1/sendreset", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    captchaToken: captchaToken
                })
            });
            res(await data.json() as PasswordResetResult);
        });
    }

    resetPassword(username : string, email : string, code : string, newPassword : string) {
        return new Promise<PasswordResetResult>(async res => {
            var data = await fetch(this.apiEndpoint + "/api/v1/reset", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    code: code,
                    newPassword: newPassword
                })
            });
            res(await data.json() as PasswordResetResult);
        });
    }
}

export interface AuthServerInformation {
    registrationOpen : boolean;
    hcaptcha : {
        required : boolean;
        siteKey : string | undefined;
    };
}

export interface AccountRegisterResult {
    success : boolean;
    error : string | undefined;
    verificationRequired : boolean | undefined;
    username : string | undefined;
    email : string | undefined;
    sessionToken : string | undefined;
}

export interface AccountLoginResult {
    success : boolean;
    token : string | undefined;
    error : string | undefined;
    verificationRequired : boolean | undefined;
    email : string | undefined;
    username : string | undefined;
}

export interface SessionResult {
    success : boolean;
    error : string | undefined;
    banned : boolean;
    username : string | undefined;
    email : string | undefined;
}

export interface VerifyEmailResult {
    success : boolean;
    error : string | undefined;
    sessionToken : string | undefined;
}

export interface LogoutResult {
    success : boolean;
    error : string | undefined;
}

export interface Account {
    username : string;
    email : string;
    sessionToken : string;
}

export interface UpdateAccountResult {
    success : boolean;
    error : string | undefined;
    verificationRequired : boolean | undefined;
    sessionExpired : boolean | undefined;
}

export interface PasswordResetResult {
    success : boolean;
    error : string | undefined;
}