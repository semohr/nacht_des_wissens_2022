import useSocket from "lib/useSocket";
import { useCallback, useEffect } from 'react';

export default function NumPad({ expID, onClick = (num) => { }, exp_is_running = true }) {

    const socket = useSocket();

    const groups = [];
    for (var g = 2; g >= 0; g--) {
        const group = []
        for (var i = 0; i < 3; i++) {
            group.push(
                <button
                    key={i}
                    id={"b" + (g * 3 + i + 1)}
                    className="btn btn-lg btn-outline-primary"
                    onClick={() => {
                        console.log("clicked " + (g * 3 + i + 1));
                        console.log(socket)
                        socket.emit("experiment:return", g * 3 + i + 1, expID);
                        onClick(g * 3 + i + 1)
                    }}
                    disabled={!exp_is_running}>
                    {g * 3 + i + 1}
                </button>
            );
        }
        groups.push(<div key={g} className="column">{group}</div>)
    }

    // handle keyboard input
    const handleKeyPress = useCallback((event) => {
        event.preventDefault();
        console.log(typeof(event.key));
        if (![ "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(event.key)) {
            return;
        }
        let bid = "b" + event.key;
        document.getElementById(bid).focus();
        document.getElementById(bid).click();
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
