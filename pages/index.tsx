import useTranslation from "next-translate/useTranslation";
import { LanguageSelector } from "components/LanguageSelector";
import StartButton from "components/experiment/StartButton";
import Settings from "components/Settings";
import { useLocalStorage } from "react-use";
import { useEffect, useState } from "react";

export default function Welcome() {
    const { t, lang } = useTranslation("common");
    const [_role, _setRole] = useLocalStorage<"receiver" | "emitter">(
        "role",
        "receiver"
    );
    const [role, setRole] = useState("");
    // Strings
    const title = t("title");

    useEffect(() => {
        setRole(_role);
    }, [_role]);

    const introduction_rec = t("introduction_receiver");
    const introduction_em = t("introduction_emitter");

    return (
        <div className="container-fluid p-3 vh-100 ">
            <div className="d-flex justify-content-between">
                <Settings />
                <LanguageSelector />
            </div>
            <div className="row gy-2">
                <div className="col-12 welcome mb-2">
                    <div>
                        <h1>{title}</h1>
                    </div>
                    <div>
                        <div>
                            {role == "receiver"
                                ? introduction_rec
                                : introduction_em}
                        </div>
                    </div>
                    <StartButton />
                </div>
            </div>
        </div>
    );
}
