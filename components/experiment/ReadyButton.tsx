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
        <>
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
        </>
    );
}

export function ReadyBtnWithTeamname({ onClick = () => { }, initial = false }) {
    const socket = useSocket();
    const [role, setRole] = useLocalStorage<"receiver" | "emitter">("role");
    const [ready, setReady] = useState(initial);
    const [tn, setTn] = useState("");
    const [bg, setBg] = useState("transparent");

    //Translations
    const { t } = useTranslation("experiment");
    const ready_str = t("ready");
    const waiting_msg = t("waiting_msg");

    const teamname = t("Teamname", { n_th: role == "emitter" ? "first" : "second" });
    return (
        <>
            <div className="readyBtn d-flex flex-column">
                {ready ? <div className="ready">{waiting_msg}</div> : null}
                <p>{teamname}</p>
                <input id="teamname_input" type="text" onChange={(e) => { setTn(e.target.value) }} style={{ backgroundColor: bg }} />
                <button onClick={(e) => {
                    if (tn == "") {
                        setBg("red");
                        setTimeout(() => {
                            setBg("transparent");
                        }, 500);
                        return
                    }

                    onClick();
                    socket!.emit("experiment:ready", role, tn);
                    setReady(true);
                    // disable button
                    (document.getElementById("teamname_input") as HTMLInputElement)!.disabled = true;
                    (e.target as HTMLButtonElement).disabled = true;
                }
                } className="btn btn-lg btn-secondary m-3" >{ready_str.toUpperCase()}</button>
            </div >
        </>
    );
}