import useSocket from "lib/useSocket";
import { useEffect, useState } from "react";

export default function ProgressBar() {
    const [progress, setProgress] = useState(0);
    const [curBlock, setBlock] = useState(0);
    const socket = useSocket();


    useEffect(() => {
        if (socket) {
            socket.on("experiment:progressBar", (currentEvent, currentBlock, num_events, num_blocks) => {
                //Atm progress is reset for each block and color is updated
                const progress = ((currentEvent + 1) / num_events) * 100;
                setProgress(progress);
                setBlock(currentBlock);
            });
        }
    }, [socket]);

    return (
        <div className={"progress block-" + curBlock}>
            <div className="progress-bar" style={{ "width": progress + "%" }} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}></div>
        </div >
    )
}