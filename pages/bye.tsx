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
    const [informationRate, setInformationRate] = useState<number>(0);
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
            setInformationRate(data.mi_bits_s);
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
    const { t } = useTranslation("common");
    const thank_you_msg = t("thank_you_msg");
    const results_msg = t("thank_you_results", { accuracy: (accuracy * 100).toFixed(0), duration: (duration / 1000).toFixed(2) });
    const more_details = t("thank_you_results_more");
    const retry = t("retry");
    const end = t("end");
    const accuracy_msg = t("Accuracy")
    const duration_msg = t("Duration")
    const ir_msg = t("InformationRate")

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
            <div className="btn-group btn-group-lg mt-2" role="group">
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
                    <h2 className="mb-5">{thank_you_msg}</h2>
                    {/* <h2 dangerouslySetInnerHTML={{ __html: {thank_you_msg} }}></h2> */}
                    <h2>{accuracy_msg} <b>{(accuracy * 100).toFixed(0)}&thinsp;%</b> </h2>
                    <h2 className="">{duration_msg} <b>{(duration / 1000).toFixed(1)}&thinsp;s</b></h2>
                    <h2 className="mb-3">{ir_msg} <b>{Math.abs(informationRate).toFixed(1)}&thinsp;bits/s</b></h2>
                    <div className="m-2 d-flex flex-row align-items-center">
                        <p className="m-0" style={{ width: "200px" }}>{more_details}</p>
                        <img ref={img_ref} height={"200px"} width={"200px"} />
                    </div>
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
