export default function doCaptcha(sitekey) {
    return new Promise((res, rej) => {
        const modal = new bootstrap.Modal(document.getElementById('hcaptchaModal'));
        modal.show();
        hcaptcha.render("captcha-box", {
            sitekey: sitekey,
            callback: (c) => {
                modal.hide();
                res(c);
            },
        });
    })
}
