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