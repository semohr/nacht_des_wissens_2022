import useTranslation from "next-translate/useTranslation"
import { useRouter } from "next/router";

export default function StartButton() {
    const { t } = useTranslation("common");

    const router = useRouter();
    const begin = t("Begin");

    return (
        <div className="beginBtn">
            <button className="btn btn-lg btn-primary" onClick={() => { router.push("/experiment") }}>
                {begin.toUpperCase()}
            </button>
        </div>
    )
}

export function StartForm() {
    const { t } = useTranslation("common");

    const router = useRouter();
    const begin = t("Begin");
    const insert_teamname = t("Teamname", { n_th: "first" });



    return (
        <form id="start-form" onSubmit={(e) => {
            e.preventDefault();

            router.push("/experiment")
        }}>
            <p>{insert_teamname}</p>
            <input type="text w-80" />
            <div className="beginBtn">
                <button type="submit" className="btn btn-lg btn-primary">
                    {begin.toUpperCase()}
                </button>
            </div>
        </form>
    )
}