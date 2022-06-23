import useSocket from "lib/useSocket";
import { useCallback, useEffect, useState } from 'react';

export default function NumPad({ expID, onClick = (num) => { }, exp_is_running = true }) {

    const socket = useSocket();
    const [buttons_enabled, setButtons_enabled] = useState(exp_is_running);

    // only enable pressing a button once a new number has been shown to the other user
    useEffect(() => {
        if (socket) {
            socket.on("experiment:event", (random_number, r_expID) => {
                // console.log(random_number,r_expID)
                setButtons_enabled(true);
            })
        }
    }, [socket]);


    const groups = [];
    for (var g = 2; g >= 0; g--) {
        const group = []
        for (var i = 0; i < 3; i++) {
            group.push(
                <button
                    key={i}
                    id={"b" + (g * 3 + i + 1)}
                    className="btn btn-lg btn-outline-primary"
                    onClick={(event) => {
                        console.log(event.target.id);
                        // document.getElementById(event.target.id).blur();
                        // console.log("clicked " + (g * 3 + i + 1));
                        setButtons_enabled(false);
                        socket.emit("experiment:return", g * 3 + i + 1, expID);
                        onClick(g * 3 + i + 1);
                    }}
                    onTouchStart={(event) => {
                        let btns = document.getElementsByClassName("btn-outline-secondary");
                        for (var i = 0; i < btns.length; i++) {
                            btns[i].classList.add("btn-outline-primary");
                            btns[i].classList.remove("btn-outline-secondary");
                        }

                        (event.target as HTMLButtonElement).classList.remove("btn-outline-secondary");
                        (event.target as HTMLButtonElement).classList.remove("btn-outline-primary");
                        (event.target as HTMLButtonElement).classList.add("btn-primary");
                    }}
                    onTouchEnd={(event) => {
                        (event.target as HTMLButtonElement).classList.remove("btn-primary");
                        (event.target as HTMLButtonElement).classList.add("btn-outline-secondary");
                        // console.log("touchend " + event.target.id);
                        setTimeout(function() {
                            document.getElementById(event.target.id).blur();
                        }, 500);
                    }}
                    disabled={!buttons_enabled}
                >
                {g * 3 + i + 1}
                </button>
            );
        }
        groups.push(<div key={g} className="column">{group}</div>)
    }

    // handle keyboard input
    const handleKeyPress = useCallback((event) => {
        event.preventDefault();
        // console.log(typeof(event.key));
        if (![ "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(event.key)) {
            return;
        }
        let bid = "b" + event.key;
        document.getElementById(bid)!.focus();
        document.getElementById(bid)!.click();
    }, []);

    useEffect(() => {
        // attach the event listener
        document.addEventListener('keydown', handleKeyPress);

        // remove the event listener
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleKeyPress]);


    return (
        <div className="numPad" id="numPad">
            {groups}
        </div>
    )



}


function fix_sticky_button() {

}
