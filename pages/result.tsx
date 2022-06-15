import { LanguageSelector } from "components/LanguageSelector";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import { MouseEventHandler, useEffect, useState } from "react";

export default function Results() {
    const [data, setData] = useState(null);

    useEffect(() => {
        console.log(data)
    }, [data]);

    var description;
    if (!data) {
        description = <InputExpID setData={setData} />
    } else {
        description = <PrettyPrintJson data={data} />
    }
    return (
        <>
            <LanguageSelector />
            {description}
        </>
    )
}

export function InputExpID({ setData }) {
    // Get the expID from the URL if defined
    const router = useRouter()
    var { expID } = router.query;
    if (!expID) {
        expID = ""
    }
    const [_expID, setexpID] = useState(expID);
    const [error, setError] = useState(false);

    //Translation
    const { t, lang } = useTranslation("result");
    const title = t("results")
    const msg = t("thank_you_msg");
    const cont = t("continue");
    const error_msg = t("error_msg")

    const errorDiv = (
        <div className="alert alert-warning fade show">
            {error_msg}
        </div>)

    return (
        <div className="d-flex flex-center vh-100 flex-column">
            <h1>{title}</h1>
            <p>{msg}</p>
            {error ? errorDiv : null}
            <div className="d-flex flex-column ">
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                        const data = await submitExpID(_expID);
                        setData(data);
                    } catch (error) {
                        setError(true)
                        setTimeout(() => { setError(false) }, 60000)
                    }
                }}>
                    <input type="string" id="expID" name="expID" placeholder="ID" value={_expID} onChange={(e) => setexpID(e.target.value)} />
                    <button type="submit" className="btn btn-primary m-3">{cont}</button>
                </form>
            </div>
        </div>
    )
}


async function submitExpID(expID) {
    // Check if file exists
    const res = await fetch("/api/" + expID, {
        method: "GET",
    });
    console.log(res)

    if (!res.ok) {
        throw Error("Server error: ExpID not found")
    }
    return res.json();
}

export const PrettyPrintJson = (props) => {
    return (
        <div>
            <pre>{JSON.stringify(props, null, 2)}</pre>
        </div>
    );
};
