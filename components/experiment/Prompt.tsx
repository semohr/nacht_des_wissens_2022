import useSocket from "lib/useSocket";
import useTranslation from "next-translate/useTranslation";
import { useEffect, useState } from "react";

export default function Prompt({ expID }) {

    const [num, setNum] = useState(null);
    const [color, setColor] = useState("black");
    const socket = useSocket();

    //Translation
    const { t } = useTranslation("experiment");
    const prompt = t("prompt");


    useEffect(() => {
        if (socket) {
            socket.on("experiment:event", (random_number, r_expID) => {
                setColor("white");
                setTimeout(() => {
                    setColor("black");
                }, 10);
                setNum(random_number);
            })
        }
    }, [socket]);


    return (
        <div className="prompt">
            <div className="text">
                {prompt}
            </div>
            <div className="number" style={{ "color": color }}>
                {!num ? "[?]" : num}
            </div>
        </div>
    );
}

function flashScreen() {
    var body = document.getElementsByTagName("body")[0];
    body.style.backgroundColor = "gray";
    setTimeout(() => {
        body.style.backgroundColor = "transparent";
    });
}