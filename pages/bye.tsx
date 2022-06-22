import { LanguageSelector } from "components/LanguageSelector";
import useSocket from "lib/useSocket";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "react-use";
import QRCode from 'qrcode'

export default function Bye() {
    const router = useRouter();
    const { teamname, expID } = router.query;
    const socket = useSocket();
    const [_role, _setRole] = useLocalStorage<"receiver" | "emitter">("role", "receiver");
    const img_ref = useRef<HTMLImageElement>(null);
    // workaround for hydartion bug
    const [role, setRole] = useState("");
    useEffect(() => {
        setRole(_role);
        //Set image qrcode
        var url = "https://information-theory.ds.mpg.de/"
        if (teamname) {
            url += "?teamname=" + teamname
        }
        generateQR(url).then((url) => {
            img_ref.current.src = url;
        })
    }, []);

    // we need a listener when the emitter presses a button, also update receivers page.
    useEffect(() => {
        if (socket) {
            socket.on("bye", (try_again: boolean, _expID) => {
                console.log("bye received", try_again, _expID)
                if (expID != _expID) {
                    console.log("id mismatch " + expID + " != " + _expID)
                    return
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
    const { t, lang } = useTranslation("result");
    const title = t("results")
    const msg = t("thank_you_msg");
    const cont = t("continue");
    const error_msg = t("error_msg")
    const retry = t("retry")
    const end = t("end")

    var buttons_to_retry = null;



    if (role == "receiver") {
    } else if (role == "emitter") {
        buttons_to_retry = (<div className="btn-group btn-group-lg mt-5" role="group">
            <button className="btn btn-outline-primary" onClick={() => {
                socket.emit("bye", false, expID);
                router.push("/");
            }}
            >{end} <i className="bi bi-check2-square"></i>
            </button>
            <button className="btn btn-outline-primary" onClick={() => {
                socket.emit("bye", true, expID);
                router.push("/experiment?team_name=" + teamname);
            }}
            >{retry} <i className="bi bi-arrow-counterclockwise"></i>
            </button>
        </div>);
    } else {
        console.log("role not defined")
    }

    return (
        <>
            <div className="container-fluid p-3 vh-100 ">
                <div className="d-flex justify-content-end">
                    <LanguageSelector />
                </div>
                <div className="d-flex flex-center flex-column vh-100 p-5">
                    <h1>{teamname},</h1>
                    <h2>{msg}</h2>
                    <img ref={img_ref} />
                    {buttons_to_retry}

                </div>
            </div>
        </>
    )
}


const generateQR = async text => {
    try {
        return await QRCode.toDataURL(text)
    } catch (err) {
        console.error(err)
    }
}
