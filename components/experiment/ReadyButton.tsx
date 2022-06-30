// contains code required to setup the experiment
// e.g. teamname selection


import useSocket from "lib/useSocket";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
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
// and can enter a teamname. force_teamname is a string if the team already played and
// we are reusing the teamame. this disables the check if the teamname is already taken.
export function ReadyBtnEmitter({ onClick = () => { }, initial = false, force_teamname = undefined }) {
    const socket = useSocket();
    const [ready, setReady] = useState(initial);
    const [outline, setOutline] = useState(false);

    const [used, setUsed] = useState(false);

    //Translations
    const { lang, t } = useTranslation("common");
    const ready_str = t("ready");
    const waiting_msg = t("waiting_msg");
    const error_msg = t("error_teamname_already_taken");

    // Set status feedback div on validate
    var status_feedback = null;
    if (ready) {
        status_feedback = <div className="valid-feedback ready" style={{ display: "block" }}>{waiting_msg}</div>
    }
    if (used) {
        status_feedback = <div className="invalid-feedback" style={{ display: "block" }}>{error_msg}</div>
    }


    // handle keyboard
    const buttonRefSubmit = useRef(null);
    const buttonRefTeamname = useRef(null);
    // handle keyboard input
    const handleKeyPress = useCallback((event) => {
        // event.preventDefault();
        // console.log(event.code)
        if (event.key === "Enter") {
            buttonRefSubmit.current.click();
        } else if (event.key == " ") {
            buttonRefTeamname.current.click();
        }
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
        <div className="p-3">
            <form className="needs-validation" noValidate
                onSubmit={async (e) => {
                    setUsed(false);
                    e.preventDefault();
                    const teamname = (document.getElementById("input_teamname") as HTMLInputElement).value;



                    // Check if teamname exists:
                    const used = await fetchTeamnameUsed(teamname);
                    console.log("teamname " + teamname + " has been used before: " + used);
                    if (used && !force_teamname) {
                        (document.getElementById("input_teamname") as HTMLInputElement).classList.add('is-invalid');
                        e.preventDefault();
                        e.stopPropagation();
                        setUsed(true);
                        return;
                    } else {
                        (document.getElementById("input_teamname") as HTMLInputElement).classList.remove('is-invalid');
                        (document.getElementById("input_teamname") as HTMLInputElement).classList.add('is-valid');
                    }

                    console.log(e)
                    // custom bootstrap validation
                    if (!(e.target as HTMLFormElement).checkValidity()) {

                        e.preventDefault();
                        e.stopPropagation();
                        (e.target as HTMLFormElement).classList.add('was-validated');
                        return;
                    }

                    (e.target as HTMLFormElement).classList.add('was-validated')

                    socket!.emit("experiment:ready", "emitter", teamname);
                    setReady(true);

                    // disable buttons
                    (document.getElementById("input_teamname") as HTMLInputElement).disabled = true;
                    (document.getElementById("button_ready") as HTMLButtonElement).disabled = true;
                    (document.getElementById("button_newname") as HTMLButtonElement).disabled = true;
                }}>
                <label htmlFor="input_teamname" className="form-label">{t("Teamname")}</label>
                <div className="input-group">
                    <input
                        type="text"
                        className="form-control"
                        id="input_teamname"
                        placeholder="TeamName"
                        disabled={force_teamname}
                        value={force_teamname || undefined}
                        required
                        autoComplete="off"
                        // prevent bootstraps checking as one types cos we do not want
                        // to spam the server with requests
                        onInput={e => e.preventDefault()}
                    />
                    <button
                        ref={buttonRefTeamname}
                        id="button_newname"
                        className="btn btn-outline-secondary rotate-outer"
                        type="button"
                        onClick={
                            async () => { updateTeamnamePlaceholder(lang) }
                        }
                        disabled={force_teamname}>
                        <span className="rotate-inner">
                            <i className="bi bi-arrow-counterclockwise"></i>
                        </span>
                    </button>
                </div>
                {status_feedback}
                <div className="readyBtn">
                    <button ref={buttonRefSubmit}
                        id="button_ready" type="submit"
                        onClick={onClick}
                        className="btn btn-lg btn-primary" >
                        {ready_str}
                    </button>
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
    const { t } = useTranslation("common");
    const ready_str = t("ready");
    const waiting_msg = t("waiting_msg");

    // handle keyboard
    const buttonRefSubmit = useRef(null);
    // handle keyboard input
    const handleKeyPress = useCallback((event) => {
        // event.preventDefault();
        // console.log(event.code)
        if (event.key === "Enter") {
            buttonRefSubmit.current.click();
        }
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
        <div className="readyBtn">
            {ready ? <div className="ready">{waiting_msg}</div> : null}
            <button ref={buttonRefSubmit} onClick={(e) => {
                onClick();
                socket!.emit("experiment:ready", "receiver");
                setReady(true);
                // disable button
                (e.target as HTMLButtonElement).disabled = true;
            }
            } className="btn btn-lg btn-primary" >{ready_str}</button>
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
    const { t } = useTranslation("common");
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
            } className="btn btn-lg btn-primary m-3" >{ready_str}</button>
        </div >
    );
}


async function fetchTeamname(language: string) {
    const teamname = await fetch("/api/teamname?language=" + language).then(res => res.json()).catch(e => {
        // console.log(e);
        return fetchTeamname(language);
    });
    return teamname["team_name"];
}

async function fetchTeamnameUsed(teamname: string) {
    const valid = await fetch("/api/teamname_is_used?teamname=" + teamname).then(res => res.json()).catch(
        e => {
            // console.log(e);
            return false;
        });
    return valid["used"];
}


async function updateTeamnamePlaceholder(language: string) {
    const teamname = await fetchTeamname(language);
    // console.log(teamname);
    (document.getElementById("input_teamname") as HTMLInputElement).value = teamname;
}

