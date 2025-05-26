import twemoji from '@twemoji/api';

export function GetCountryFlag(countryCode: string) {
    if (countryCode.length !== 2) throw new Error("Country code must be two characters.");
    return twemoji.parse(String.fromCodePoint(...countryCode.toUpperCase().split('').map(char =>  127397 + char.charCodeAt(0))));
}