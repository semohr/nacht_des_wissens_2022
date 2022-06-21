import useSocket from "lib/useSocket";
import useTranslation from "next-translate/useTranslation";
import { useEffect, useState } from "react";
import useLocalStorage from "react-use/lib/useLocalStorage";
import ReadyBtn, { ReadyBtnWithTeamname } from "components/experiment/ReadyButton";
import NumPad from "components/experiment/NumPad";
import Prompt from "components/experiment/Prompt";
import ProgressBar from "components/experiment/ProgressBar";
import { useRouter } from "next/router";

export default function experiment() {
    // Check if both players are ready
    const [started, setStarted] = useState(false);
    const [expID, setExpID] = useState(null);
    const [_role, _setRole] = useLocalStorage<"receiver" | "emitter">("role", "receiver");
    const [role, setRole] = useState("");
    const [backgroundC, setbackgroundC] = useState("transparent");

    const socket = useSocket();
    const router = useRouter();

    useEffect(() => {
        setRole(_role);
    }, []);


    useEffect(() => {
        if (socket) {
            socket.on("experiment:start", (expID) => {
                setStarted(true);
                setExpID(expID);
            });
            socket.on("experiment:end", (expID, teamname) => {
                socket.close();
                router.push("/bye?teamname=" + teamname + "&expID=" + expID);
            });
        }
    }, [socket]);

    var form = null;
    if (role == "receiver") {
        form = <NumPad expID={expID} exp_is_running={started} />
    } else if (role == "emitter") {
        form = <Prompt expID={expID} exp_is_running={started} />
    }

    return (
        <>
            <div className="container-fluid d-flex vh-100 flex-center flex-column">
                {form}
                {!started ? <ReadyBtn role={role} /> : null}
                <ProgressBar />
            </div>
        </>
    );
}
