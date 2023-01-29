export function makeperms(mask, config) {
    const perms = {
        restore: false,
        reboot: false,
        ban: false,
        forcevote: false,
        mute: false,
        kick: false,
        bypassturn: false,
        rename: false,
        grabip: false,
        xss: false
    };
    if ((mask & 1) !== 0) perms.restore = true;
    if ((mask & 2) !== 0) perms.reboot = true;
    if ((mask & 4) !== 0) perms.ban = true;
    if ((mask & 8) !== 0) perms.forcevote = true;
    if ((mask & 16) !== 0) perms.mute = true;
    if ((mask & 32) !== 0) perms.kick = true;
    if ((mask & 64) !== 0) perms.bypassturn = true;
    if ((mask & 128) !== 0) perms.rename = true;
    if ((mask & 256) !== 0) perms.grabip = true;
    if (config.xssImplementation === 2 && (mask & 512) !== 0) perms.xss = true;
    return perms;
}