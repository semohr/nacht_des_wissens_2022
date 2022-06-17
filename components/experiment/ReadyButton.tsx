// contains code required to setup the experiment
// e.g. teamname selection


import useSocket from "lib/useSocket";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useLocalStorage from "react-use/lib/useLocalStorage";


export default function ReadyBtn({ onClick = () => { }, initial = false, role }) {
    const router = useRouter();
    const { team_name } = router.query;

    if (role == "receiver") {
        return <ReadyBtnReceiver onClick={onClick} initial={initial} />;
    } else if (role == "emitter") {
        return <ReadyBtnEmitter onClick={onClick} initial={initial} force_teamname={team_name} />;
    } else {
        console.log("unknown role: " + role);
        return null;
    }
}

// the emitter reads out the numbers, thus is likely in front of PC
// and can enter a teamname.
export function ReadyBtnEmitter({ onClick = () => { }, initial = false, force_teamname = undefined }) {
    const socket = useSocket();
    const [ready, setReady] = useState(initial);
    const [outline, setOutline] = useState(false);

    //Translations
    const { t } = useTranslation("experiment");
    const ready_str = t("ready");
    const waiting_msg = t("waiting_msg");

    return (
        <div className="p-3">
            <form className="needs-validation" noValidate
                onSubmit={e => {
                e.preventDefault();
                const teamname = (document.getElementById("input_teamname") as HTMLInputElement).value;

                console.log(e)
                // custom bootstrap validation
                if (!e.target.checkValidity()) {
                    e.preventDefault()
                    e.stopPropagation()
                    e.target.classList.add('was-validated')
                    return;
                }

                e.target.classList.add('was-validated')

                socket!.emit("experiment:ready", "emitter", teamname);
                setReady(true);

                // disable buttons
                (document.getElementById("input_teamname") as HTMLInputElement).disabled = true;
                (document.getElementById("button_ready") as HTMLButtonElement).disabled = true;
                (document.getElementById("button_newname") as HTMLButtonElement).disabled = true;
            }}>
                <label htmlFor="input_teamname" className="form-label">{t("Teamname")}</label>
                    <div className="input-group mb-3 ">
                        <input
                            type="text"
                            className="form-control"
                            id="input_teamname"
                            placeholder="TeamName"
                            disabled={force_teamname}
                            value={force_teamname || undefined}
                            required
                            autocomplete="off"
                        />
                        <button id="button_newname" className="btn btn-outline-secondary rotate-outer" type="button" onClick={async () => { updateTeamnamePlaceholder() }} disabled={force_teamname}>
                            <span className="rotate-inner"><i className="bi bi-arrow-counterclockwise"></i></span>
                        </button>
                    </div>

                <div className="readyBtn">
                    {ready ? <div className="ready p-2">{waiting_msg}</div> : null}
                    <button id="button_ready" type="submit" onClick={(e) => {
                        onClick();
                    }
                    } className="btn btn-lg btn-primary" >{ready_str.toUpperCase()}</button>
                </div >
            </form>
        </div>
    );
}

// the receiver has the numpad and listens to spoken words of emitter
export function ReadyBtnReceiver({ onClick = () => { }, initial = false }) {
    const socket = useSocket();
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
                socket!.emit("experiment:ready", "receiver");
                setReady(true);
                // disable button
                (e.target as HTMLButtonElement).disabled = true;
            }
            } className="btn btn-lg btn-primary" >{ready_str.toUpperCase()}</button>
        </div >
    );
}

export function ReadyBtnWithTeamname({ onClick = () => { }, initial = false }) {
    const socket = useSocket();
    const [role, setRole] = useLocalStorage<"receiver" | "emitter">("role", "receiver");
    const [ready, setReady] = useState(initial);
    const [tn, setTn] = useState("");
    const [bg, setBg] = useState("transparent");

    //Translations
    const { t } = useTranslation("experiment");
    const ready_str = t("ready");
    const waiting_msg = t("waiting_msg");

    const teamname = t("Teamname", { n_th: role == "emitter" ? "first" : "second" });
    return (
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
            } className="btn btn-lg btn-primary m-3" >{ready_str.toUpperCase()}</button>
        </div >
    );
}


async function fetchTeamname() {
    const teamname = await fetch("/api/teamname").then(res => res.json()).catch(e => {
        console.log(e);
        return fetchTeamname();
    });
    return teamname["team_name"];
}

async function updateTeamnamePlaceholder() {
    const teamname = await fetchTeamname();
    console.log(teamname);
    (document.getElementById("input_teamname") as HTMLInputElement).value = teamname;
}

