import { LanguageSelector } from "components/LanguageSelector";
import useSocket from "lib/useSocket";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "react-use";
import QRCode from "qrcode";

export default function Bye() {
    const router = useRouter();
    const { teamname, expID } = router.query;
    const socket = useSocket();
    const [_role, _setRole] = useLocalStorage<"receiver" | "emitter">(
        "role",
        "receiver"
    );
    const [accuracy, setAccuracy] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const img_ref = useRef<HTMLImageElement>(null);
    // workaround for hydartion bug
    const [role, setRole] = useState("");
    useEffect(() => {
        setRole(_role);

        //Set image qrcode
        var url = "http://information-theory.ds.mpg.de/";
        if (teamname) {
            url += "?teamname=" + teamname;
        }
        generateQR(url).then((url) => {
            img_ref.current.src = url;
        });
    }, []);

    useEffect(() => {
        // Get results
        const get = async () => {
            const data = await fetch(`/api/results/` + expID).then((res) =>
                res.json()
            );
            console.log(data);

            // calc accuracy between emitted and received
            // Also calc total duration
            var accuracy = 0;
            var duration = 0;
            for (var i = 0; i < data.emitted[0].length; i++) {
                const e = data.emitted[0][i];
                const r = data.received[0][i];
                if (e == r) {
                    accuracy += 1;
                }

                // calc total duration
                duration += data.duration[0][i];
            }
            accuracy = accuracy / data.emitted[0].length;
            setAccuracy(accuracy);
            setDuration(duration);
        };
        if (expID) {
            get();
        }
    }, [expID]);

    // we need a listener when the emitter presses a button, also update receivers page.
    useEffect(() => {
        if (socket) {
            socket.on("bye", (try_again: boolean, _expID) => {
                console.log("bye received", try_again, _expID);
                if (expID != _expID) {
                    console.log("id mismatch " + expID + " != " + _expID);
                    return;
                }
                if (try_again) {
                    router.push("/experiment?team_name=" + teamname);
                } else {
                    router.push("/");
                }
            });
        }
    }, [socket]);

    //Translation
    const { t, lang } = useTranslation("common");
    const title = t("results");
    const msg = t("thank_you_msg");
    const cont = t("continue");
    const error_msg = t("error_msg");
    const retry = t("retry");
    const end = t("end");

    var buttons_to_retry_em = null;
    var buttons_to_retry_rec = <p></p>;
    if (role == "receiver") {
        buttons_to_retry_rec = (
            <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                    router.push("/");
                }}
            >
                {end} <i className="bi bi-check2-square"></i>
            </button>
        );
    } else if (role == "emitter") {
        buttons_to_retry_em = (
            <div className="btn-group btn-group-lg mt-5" role="group">
                <button
                    className="btn btn-outline-primary"
                    onClick={() => {
                        socket.emit("bye", false, expID);
                        router.push("/");
                    }}
                >
                    {end} <i className="bi bi-check2-square"></i>
                </button>
                <button
                    className="btn btn-outline-primary"
                    onClick={() => {
                        socket.emit("bye", true, expID);
                        router.push("/experiment?team_name=" + teamname);
                    }}
                >
                    {retry} <i className="bi bi-arrow-counterclockwise"></i>
                </button>
            </div>
        );
    } else {
        console.log("role not defined");
    }

    return (
        <>
            <div className="container-fluid p-3 vh-100 ">
                <div className="d-flex justify-content-between">
                    {buttons_to_retry_rec}
                    <LanguageSelector />
                </div>
                <div className="d-flex flex-center flex-column vh-100 p-5">
                    <h1>{teamname},</h1>
                    <h2>{msg}</h2>
                    <img ref={img_ref} />
                    <h2>{(accuracy * 100).toFixed(0)}%</h2>
                    <h2>{(duration / 1000).toFixed(2)}s</h2>
                    {buttons_to_retry_em}
                </div>
            </div>
        </>
    );
}

const generateQR = async (text) => {
    try {
        return await QRCode.toDataURL(text, {
            color: {
                dark: "#000",
                light: "#0000",
            }
        });
    } catch (err) {
        console.error(err);
    }
};

function results() {
    //Fetch results
}
