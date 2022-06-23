import useSocket from "lib/useSocket";
import { useCallback, useEffect, useState } from "react";

//The number is not updated if the same is added to the stack
// as react does not update the state if it was not changed...
// here we introduce the toggle var to make sure that the number is updated
// in these cases
export default function NumberHistory({ number = undefined, toggle = false }) {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (number) {
            addToHistory(number);
        }
    }, [number, toggle]);

    const addToHistory = (number) => {
        // add new_num tag to the element which is removed after 1 second
        let element = <div key={number + "-" + Math.random()}>{number}</div>;

        //Check length and add or remove
        const max = 10;
        if (history.length <= max) {
            setHistory([...history, element]);
        } else {
            setHistory([...history.slice(1, history.length), element]);
        }
    };

    return (
        <div className="d-flex w-50">
            <div
                className="ml-2 d-flex flex-row numHistory w-100"
                id="numHistory"
            >
                {history}
            </div>
        </div>
    );
}
