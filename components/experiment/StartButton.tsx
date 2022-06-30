import useTranslation from "next-translate/useTranslation"
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef } from "react";

export default function StartButton() {
    const { t } = useTranslation("common");
    const router = useRouter();
    const begin = t("Begin");
    const buttonRef = useRef(null);

    // handle keyboard input
    const handleKeyPress = useCallback((event) => {
        // console.log("key " + event.key);
        // console.log("code " + event.code);
        if (! (event.key === "Enter")) {
            return;
        }
        buttonRef.current.click();
    }, []);

    useEffect(() => {
        // attach the event listener
        document.addEventListener("keydown", handleKeyPress);
        // remove the event listener
        return () => {
            document.removeEventListener("keydown", handleKeyPress);
        };
    }, [handleKeyPress]);

    return (
        <div className="beginBtn">
            <button ref={buttonRef} className="btn btn-lg btn-primary" onClick={() => { router.push("/experiment") }}>
                {begin}
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
                    {begin}
                </button>
            </div>
        </form>
    )
}
