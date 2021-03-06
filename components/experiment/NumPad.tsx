import useSocket from "lib/useSocket";
import { useCallback, useEffect, useState } from "react";
import NumberHistory from "./NumberHistory";

export default function NumPad({
    expID,
    onClick = (num) => { },
    exp_is_running = true,
}) {
    const socket = useSocket();
    const [buttons_enabled, setButtons_enabled] = useState(exp_is_running);
    const [currentNum, setCurrentNum] = useState(null);
    const [toggle, setToggle] = useState(false);
    // only enable pressing a button once a new number has been shown to the other user
    useEffect(() => {
        if (socket) {
            socket.on("experiment:event", (random_number, r_expID) => {
                // console.log(random_number,r_expID)
                setTimeout(() => {
                    setButtons_enabled(true);
                }, 300);
            });
        }
    }, [socket]);

    const groups = [];
    for (var g = 2; g >= 0; g--) {
        const group = [];
        for (var i = 0; i < 3; i++) {
            group.push(
                <button
                    key={i}
                    id={"b" + (g * 3 + i + 1)}
                    className="btn btn-lg btn-outline-primary"
                    onClick={(event) => {
                        const target = event.target as HTMLButtonElement;
                        reset_past_button();
                        setButtons_enabled(false);
                        socket.emit("experiment:return", g * 3 + i + 1, expID);
                        setCurrentNum(g * 3 + i + 1);
                        setToggle(!toggle);
                        make_past_button(target.id);
                        onClick(g * 3 + i + 1);
                    }}
                    onTouchStart={(event) => {
                        const target = event.target as HTMLButtonElement;
                        reset_past_button();
                        make_past_button(target.id);
                        make_touch_down(target.id);
                    }}
                    onTouchEnd={(event) => {
                        const target = event.target as HTMLButtonElement;
                        make_touch_end(target.id);
                        // Here we disable to button highlighting after
                        // the user has pressed it.
                        setTimeout(function () {
                            (event.target as HTMLButtonElement).blur();
                        }, 500);
                    }}
                    disabled={!buttons_enabled}
                >
                    {g * 3 + i + 1}
                </button>
            );
        }
        groups.push(
            <div key={g} className="column">
                {group}
            </div>
        );
    }

    // handle keyboard input
    const handleKeyPress = useCallback((event) => {
        event.preventDefault();
        // console.log(typeof(event.key));
        if (
            !["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(event.key)
        ) {
            return;
        }
        let bid = "b" + event.key;
        let target = document.getElementById(bid);
        target!.focus();
        target!.click();
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
        <>
            <div className="numPad" id="numPad">
                {groups}
            </div>

            <div className="d-flex justify-content-center w-100 receiver">
                <NumberHistory
                    number={currentNum}
                    toggle={toggle}
                ></NumberHistory>
            </div>
        </>
    );
}

function reset_past_button(except_id = null) {
    let btns = document.getElementsByClassName("btn-outline-secondary");
    for (var i = 0; i < btns.length; i++) {
        if (btns[i].id == except_id) continue;
        btns[i].classList.remove("btn-primary"); // in case we missed a touch-end event
        btns[i].classList.add("btn-outline-primary");
        btns[i].classList.remove("btn-outline-secondary");
    }
}

function make_past_button(button_id) {
    let btn = document.getElementById(button_id);
    btn!.classList.add("btn-outline-secondary");
}

function make_touch_down(button_id) {
    let btn = document.getElementById(button_id);
    btn!.classList.add("btn-primary");
}

function make_touch_end(button_id) {
    let btn = document.getElementById(button_id);
    btn!.classList.remove("btn-primary");

}
