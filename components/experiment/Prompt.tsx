import useSocket from "lib/useSocket";
import useTranslation from "next-translate/useTranslation";
import { useEffect, useState } from "react";
import NumberHistory from "./NumberHistory";

export default function Prompt({ expID, exp_is_running = true }) {
    const [num, setNum] = useState(null);
    const [prevNum, setPrevNum] = useState(null);
    const socket = useSocket();
    const [toggle, setToggle] = useState(false);

    //Translation
    const { t } = useTranslation("common");
    const prompt = t("prompt");

    useEffect(() => {
        if (socket) {
            socket.on("experiment:event", (random_number, r_expID) => {
                setToggle(!toggle);
                setPrevNum(num);
                setNum(random_number);
                let currentNumber = document.getElementById("currentNumber");
                currentNumber!.classList.remove("oink");
                // the line below triggers reflow so that readding the class actually
                // triggers the css animation again.
                void currentNumber.offsetWidth;
                currentNumber!.classList.add("oink");
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
                <div className="d-flex justify-content-center w-100 position-relative">
                    <NumberHistory
                        number={prevNum}
                        toggle={toggle}
                    ></NumberHistory>
                    <div className="number-container d-flex flex-column align-items-center">
                        <div id="currentNumber"
                            className="number mx-2 my-auto">
                            {!num ? "[?]" : num}
                        </div>
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
