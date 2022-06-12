import type { AppProps } from "next/app";
import Head from "next/head";
import "bootstrap/scss/bootstrap.scss"
import "bootstrap-icons/font/bootstrap-icons.scss";
import "flag-icons/sass/flag-icons.scss";
import "styles.scss"
import { useEffect } from "react";

export default function MyApp({ Component, pageProps }: AppProps) {

    // Add bootstrap js to all pages for bootstrap collapse and similar 
    useEffect(() => {
        typeof document !== undefined
            ? require("bootstrap/dist/js/bootstrap")
            : null;
    }, []);
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
