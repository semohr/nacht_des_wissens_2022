import useSocket from "lib/useSocket";
import { useCallback, useEffect, useState } from "react";
import NumberHistory from "./NumberHistory";

export default function NumPad({
    expID,
    onClick = (num) => {},
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
                        // document.getElementById(event.target.id).blur();
                        // console.log("clicked " + (g * 3 + i + 1));
                        setButtons_enabled(false);
                        socket.emit("experiment:return", g * 3 + i + 1, expID);
                        setCurrentNum(g * 3 + i + 1);
                        setToggle(!toggle);
                        onClick(g * 3 + i + 1);
                    }}
                    onTouchStart={(event) => {
                        let btns = document.getElementsByClassName(
                            "btn-outline-secondary"
                        );
                        for (var i = 0; i < btns.length; i++) {
                            btns[i].classList.add("btn-outline-primary");
                            btns[i].classList.remove("btn-outline-secondary");
                        }

                        (event.target as HTMLButtonElement).classList.remove(
                            "btn-outline-secondary"
                        );
                        (event.target as HTMLButtonElement).classList.remove(
                            "btn-outline-primary"
                        );
                        (event.target as HTMLButtonElement).classList.add(
                            "btn-primary"
                        );
                    }}
                    onTouchEnd={(event) => {
                        (event.target as HTMLButtonElement).classList.remove(
                            "btn-primary"
                        );
                        (event.target as HTMLButtonElement).classList.add(
                            "btn-outline-secondary"
                        );
                        // console.log("touchend " + event.target.id);
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
        let target = document.getElementById(bid)
        target!.focus();
        target!.click();
        // lets get the style we wanted for touch also on keyboards... yes this
        // is redundant code.
        let btns = document.getElementsByClassName(
            "btn-outline-secondary"
        );
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.add("btn-outline-primary");
            btns[i].classList.remove("btn-outline-secondary");
        }
        target!.classList.remove("btn-primary");
        target!.classList.add("btn-outline-secondary");
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

            <div className="d-flex justify-content-center w-100">
                <NumberHistory number={currentNum} toggle={toggle}></NumberHistory>
                <div className="w-25">
                </div>
            </div>

        </>
    );
}

function fix_sticky_button() {}
