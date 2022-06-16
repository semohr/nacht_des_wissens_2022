import { LanguageSelector } from "components/LanguageSelector";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";

export default function Bye() {
    const router = useRouter();
    const { teamname } = router.query;

    //Translation
    const { t, lang } = useTranslation("result");
    const title = t("results")
    const msg = t("thank_you_msg");
    const cont = t("continue");
    const error_msg = t("error_msg")
    const next_exp = t("next_exp")

    return (
        <>
            <LanguageSelector />
            <div className="d-flex flex-center flex-column vh-100 p-5">
                <h1>{title}</h1>
                <h2>{msg}</h2>
                <p>
                    {teamname}
                </p>
                <button className="btn btn-outline-primary" onClick={()=>{router.push("/")}}>{next_exp}</button>
            </div>
        </>
    )
}
