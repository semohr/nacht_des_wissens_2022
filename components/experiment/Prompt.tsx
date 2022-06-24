import useSocket from "lib/useSocket";
import useTranslation from "next-translate/useTranslation";
import { useEffect, useState } from "react";
import NumberHistory from "./NumberHistory";

export default function Prompt({ expID, exp_is_running = true }) {
    const [num, setNum] = useState(null);
    const [prevNum, setPrevNum] = useState(null);
    const [color, setColor] = useState("black");
    const socket = useSocket();
    const [toggle, setToggle] = useState(false);

    //Translation
    const { t } = useTranslation("common");
    const prompt = t("prompt");

    useEffect(() => {
        if (socket) {
            socket.on("experiment:event", (random_number, r_expID) => {
                setColor("white");
                setTimeout(() => {
                    setColor("black");
                }, 10);
                setToggle(!toggle);
                setPrevNum(num);
                setNum(random_number);
            });
        }
    }, [socket, toggle, num, prevNum]);

    // only show the readout prompt if the experiment is running
    if (!exp_is_running) {
        return <></>;
    }

    return (
        <>
            <div className="prompt">
                <div className="text">{prompt}</div>
                <div className="d-flex justify-content-center w-100">
                    <NumberHistory number={prevNum} toggle={toggle}></NumberHistory>
                    <div className="number mx-2" style={{ color: color }}>
                        {!num ? "[?]" : num}
                    </div>
                    <div className = "w-25">
                    </div>
                </div>
            </div>
        </>
    );
}

function flashScreen() {
    var body = document.getElementsByTagName("body")[0];
    body.style.backgroundColor = "gray";
    setTimeout(() => {
        body.style.backgroundColor = "transparent";
    });
}
