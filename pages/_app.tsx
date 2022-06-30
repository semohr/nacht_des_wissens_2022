import type { AppProps } from "next/app";
import Head from "next/head";
import "bootstrap/scss/bootstrap.scss"
import "bootstrap-icons/font/bootstrap-icons.scss";
import "flag-icons/sass/flag-icons.scss";
import "styles.scss"
import { useEffect, useCallback } from "react";

export default function MyApp({ Component, pageProps }: AppProps) {

    // Add bootstrap js to all pages for bootstrap collapse and similar
    useEffect(() => {
        typeof document !== undefined
            ? require("bootstrap/dist/js/bootstrap")
            : null;
    }, []);

    // handle keyboard input
    const handleKeyPress = useCallback((event) => {
        // disable globally
        // console.log(event);

        // Check if key is alphanumeric
        if (["Backspace", "_", "-"].includes(event.key)) {
            return;
        } else if (!event.key.match(/^[0-9a-zA-Z]+$/)) {
            event.preventDefault();
        } else if (event.key.length != 1 || event.ctrlKey || event.altKey || event.metaKey) {
            event.preventDefault();
        }
    }, []);

    useEffect(() => {
        // attach the event listener
        document.addEventListener("keydown", handleKeyPress);
        // remove the event listener
        return () => {
            document.removeEventListener("keydown", handleKeyPress);
        };
    }, [handleKeyPress]);

    return (
        <>
            <Head>
                <title>Information Theory</title>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
            </Head>
            <Component {...pageProps} />
        </>
    );
}
