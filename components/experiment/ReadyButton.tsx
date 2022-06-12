import useSocket from "lib/useSocket";
import useTranslation from "next-translate/useTranslation";
import { useState } from "react";
import useLocalStorage from "react-use/lib/useLocalStorage";

export default function ReadyBtn({ onClick = () => { }, initial = false }) {
    const socket = useSocket();
    const [role, setRole] = useLocalStorage<"receiver" | "emitter">("role");
    const [ready, setReady] = useState(initial);


    //Translations
    const { t } = useTranslation("experiment");
    const ready_str = t("ready");
    const waiting_msg = t("waiting_msg");

    return (
        <div className="readyBtn">
            {ready ? <div className="ready">{waiting_msg}</div> : null}
            <button onClick={(e) => {
                onClick();
                socket!.emit("experiment:ready", role);
                setReady(true);
                // disable button
                (e.target as HTMLButtonElement).disabled = true;
            }
            } className="btn btn-lg btn-secondary" >{ready_str.toUpperCase()}</button>
        </div >
    );
}