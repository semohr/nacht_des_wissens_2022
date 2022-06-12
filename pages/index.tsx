import useTranslation from "next-translate/useTranslation"
import { LanguageSelector } from "components/LanguageSelector"
import StartButton from "components/experiment/StartButton";
import Settings from "components/Settings";

export default function Welcome() {
    const { t, lang } = useTranslation("welcome");

    // Strings
    const title = t("title");
    const subtitle = t("pun");
    const weAre = t("weAre");
    const experimentDescription = t("experimentDescription");

    return (
        <div className="container-fluid p-3 vh-100 ">
            <LanguageSelector />
            <div className="welcome row gy-2">
                <div>
                    <h1>{title}</h1>
                    <h2>{subtitle}</h2>
                </div>
                <div >
                    <div>{weAre}</div>
                    <div>{experimentDescription}</div>
                </div>
                <StartButton />
            </div>
            <Settings />
        </div>
    )
}