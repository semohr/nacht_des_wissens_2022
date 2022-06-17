import useTranslation from "next-translate/useTranslation";
import Link from "next/link";
import i18nConfig from '../i18n.json'

const { locales } = i18nConfig
import setLanguage from 'next-translate/setLanguage'


export function LanguageSelector() {
    // As there is only two languages the switcher is quite
    // easy we can extend it if we decide to add more languages
    const { lang } = useTranslation();

    const other_languages = locales.filter((ls) => {
        return ls != lang
    });

    const buttons = [];
    other_languages.forEach((l) => {
        var flag = l;
        if (l == "en") {
            flag = "gb";
        }
        buttons.push(<button key={l} className="" onClick={
                async () => await setLanguage(l)
            }>
            <i className={"fi fi-" + flag}></i></button>
        )
    })

    return (
        <div className="languageSelector">
            {buttons}
        </div>
    )
}
