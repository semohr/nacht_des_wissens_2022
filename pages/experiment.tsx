import useSocket from "lib/useSocket";
import useTranslation from "next-translate/useTranslation";
import { useEffect, useState } from "react";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { ReadyBtnWithTeamname } from "components/experiment/ReadyButton";
import NumPad from "components/experiment/NumPad";
import Prompt from "components/experiment/Prompt";
import ProgressBar from "components/experiment/ProgressBar";
import { useRouter } from "next/router";

export default function experiment() {
    // Check if both players are ready
    const [started, setStarted] = useState(false);
    const [expID, setExpID] = useState(null);
    const [role, setRole] = useLocalStorage<"receiver" | "emitter">("role");
    const [backgroundC, setbackgroundC] = useState("transparent");

    const socket = useSocket();
    const router = useRouter();

    useEffect(() => {
        if (socket) {
            socket.on("experiment:start", (expID) => {
                setStarted(true);
                setExpID(expID);
            });
            socket.on("experiment:end", (expID, teamname) => {
                router.push("/bye?teamname=" + teamname);
                socket.disconnect();
            });
        }
    }, [socket]);

    var form;
    if (role == "receiver") {
        form = <NumPad expID={expID} disabled={!started} />
    } else {
        form = <Prompt expID={expID} />
    }

    return (
        <>
            <div className="container-fluid d-flex vh-100 flex-center flex-column">
                {form}
                {!started ? <ReadyBtnWithTeamname /> : null}
                <ProgressBar />
            </div>
        </>
    );
}