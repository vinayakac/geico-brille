import axios from 'axios';
import { useEffect, useState } from 'react';

export default function Test() {
    const [message, setMessage] = useState();

    const getMessage = async () => {
        try {
            const response = await fetch('/api/metrics/requests?model=cair-sales&timespan=1d');
            const data = await response.json();
            //console.log(data);
            setMessage(data.requests[0].request_count);
            //console.log(message);
        } catch (error) {
            setMessage(error);
        }
    }
    
    useEffect(() => {
        getMessage();
    })

    return(
        <div>
            <p>{message}</p>
        </div>
    )
}
