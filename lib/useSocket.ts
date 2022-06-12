import { useEffect, useState } from 'react'
import io from 'socket.io-client'


const socket = io();

export default function useSocket() {
    const [activeSocket, setActiveSocket] = useState(null);

    useEffect(() => {

        if (activeSocket || !socket) return;
        // init socket on server side
        const init = () => {
            fetch('/api/socket')
        };
        init();
        setActiveSocket(socket);

        function cleanup() {
            //socket.disconnect()
        }
        return cleanup

        // so pass an empty array
    }, [])

    return activeSocket
}