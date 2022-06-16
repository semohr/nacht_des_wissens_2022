import useLocalStorage from "react-use/lib/useLocalStorage";


export default function Settings() {
    const [settings, setSettings] = useLocalStorage<"receiver" | "emitter">("role", "receiver");
    if (!settings) {
        setSettings("receiver");
    }

    return (
        <div className="settings dropdown dropup">
            <i className="bi bi-gear" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false"></i>

            <div className="dropdown-menu bg-light" aria-labelledby="dropdownMenuButton1">
                <div className="form-check">
                    <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1"
                        value="receiver" onChange={(e) => {
                            setSettings("receiver");
                        }} checked={settings == "receiver"} />
                    <label className="form-check-label" htmlFor="flexRadioDefault1">
                        Receiver
                    </label>
                </div>
                <div className="form-check">
                    <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" value="sender"
                        onChange={(e) => { setSettings("emitter") }} checked={settings == "emitter"} />
                    <label className="form-check-label" htmlFor="flexRadioDefault2">
                        Emitter
                    </label>
                </div>
            </div>
        </div>
    )
}