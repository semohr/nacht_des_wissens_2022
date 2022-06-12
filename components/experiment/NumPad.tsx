import useSocket from "lib/useSocket";

export default function NumPad({ expID, onClick = (num) => { }, disabled = false }) {

    const socket = useSocket();

    const groups = [];
    for (var g = 0; g < 3; g++) {
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
                    disabled={disabled}>
                    {g * 3 + i + 1}
                </button>
            );
        }
        groups.push(<div key={g} className="column">{group}</div>)
    }
    return (
        <div className="numPad">
            {groups}
        </div>
    )

}