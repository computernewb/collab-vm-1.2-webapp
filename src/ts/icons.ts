// Fontawesome icon library
import { library } from "@fortawesome/fontawesome-svg-core";

import * as faSolid from "@fortawesome/free-solid-svg-icons";
import * as faBrands from "@fortawesome/free-brands-svg-icons";

export function fontAwesomeLibrary() {
    library.add(
        // fa-solid
        faSolid.faCircleQuestion,
        faSolid.faClipboardCheck,
        faSolid.faHouse,
        faSolid.faMoon,
        faSolid.faSun,
        faSolid.faUser,
        // fa-brands
        faBrands.faDiscord,
        faBrands.faMastodon,
        faBrands.faReddit,
    )
}