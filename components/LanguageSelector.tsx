import useTranslation from "next-translate/useTranslation";
import Link from "next/link";
import i18nConfig from '../i18n.json'

const { locales } = i18nConfig
import setLanguage from 'next-translate/setLanguage'


export function LanguageSelector() {
    // As there is only two languages the switcher is quite
    // easy we can extend it if we decide to add more languages
    var { lang } = useTranslation("common");

    var other_lang;
    if (lang == "de") {
        other_lang = "en"
    } else if (lang == "en") {
        lang = "gb"
        other_lang = "de"
    }

    var btn = <button key={lang} className="" onClick={
        async () => await setLanguage(other_lang)
    }>
        <i className={"fi fi-" + lang}></i>
    </button>


    return (
        <div className="languageSelector">
            {btn}
        </div>
    )
}
