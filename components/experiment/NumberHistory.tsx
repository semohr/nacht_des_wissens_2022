import useSocket from "lib/useSocket";
import { useCallback, useEffect, useState } from "react";

//The number is not updated if the same is added to the stack
// as react does not update the state if it was not changed...
// here we introduce the toggle var to make sure that the number is updated
// in these cases
export default function NumberHistory({ number = undefined, toggle = false }) {
    // init history with an empty character so the height is already allocated
    // and the numpad doesnt move.
    const max = 10;
    let history_placeholder = Array(max).fill(<div className="phantom">0</div>);
    const [history, setHistory] = useState(history_placeholder);
    console.log(history);

    const addToHistory = (number) => {
        // add new_num tag to the element which is removed after 1 second
        let element = (
            <div key={number + "-" + Math.random()} className="my-auto">
                {number}
            </div>
        );

        //Check length and add or remove
        if (history.length <= max) {
            setHistory([...history, element]);
        } else {
            setHistory([...history.slice(1, history.length), element]);
        }
    };

    useEffect(() => {
        if (number) {
            addToHistory(number);
        }
    }, [number, toggle]);

    return (
        <div className="me-1 d-flex flex-row numHistory w-50" id="numHistory">
            {history}
        </div>
    );
}
