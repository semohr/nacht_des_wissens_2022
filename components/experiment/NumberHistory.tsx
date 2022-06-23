import useSocket from "lib/useSocket";
import { useCallback, useEffect, useState } from 'react';


export default function NumberHistory({number=undefined}) {
    const [history, setHistory] = useState([]);


    useEffect(()=>{
        if (number){
            addToHistory(<div className="">{number}</div>);
    }},[number]);

    const addToHistory = (element)=>{
        //Check length and add or remove
        const max = 5;
        if (history.length <= max){
            setHistory([...history, element]);
        } else {
            setHistory([...history.slice(1, history.length), element]);
        }
    }

    // addToHistory(<div>1</div>);
    // addToHistory(<div>2</div>);
    // addToHistory(<div>3</div>);
    // addToHistory(<div>4</div>);
    // addToHistory(<div>num</div>);

    return (
        <div className="d-flex flex-row numHistory" id="numHistory">
            {history}
        </div>
    )
}
