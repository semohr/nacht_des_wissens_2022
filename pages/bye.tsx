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
    const retry = t("retry")
    const end = t("end")

    return (
        <>
            <div className="container-fluid p-3 vh-100 ">
                <div className="d-flex justify-content-end">
                    <LanguageSelector />
                </div>
                <div className="d-flex flex-center flex-column vh-100 p-5">
                    <h1>{teamname},</h1>
                    <h2>{msg}</h2>

                    <div className="btn-group btn-group-lg mt-5" role="group">
                        <button className="btn btn-outline-primary" onClick={
                            () => { router.push("/") }}
                        >{end} <i className="bi bi-check2-square"></i>
                        </button>
                        <button className="btn btn-outline-primary" onClick={
                            () => { router.push("/experiment?team_name=" + teamname) }
                        }>{retry} <i className="bi bi-arrow-counterclockwise"></i>
                        </button>
                    </div>

                </div>
            </div>
        </>
    )
}
