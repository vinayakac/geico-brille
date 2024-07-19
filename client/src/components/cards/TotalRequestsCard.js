import React from 'react';
import { useState, useEffect } from 'react';
import AreaChart from '../widgets/AreaChart';
import '../cards/cards.css'

export default function TotalRequestsCard(props) {
    const model = props.model;
    const timespan = props.timespan;
    const granularity = props.granularity;
    const rangeselector= props.rangeselector;
    const [data, setData] = useState('');

    const fetchRequests = async () => {
        try {
            const response = await fetch(`/api/metrics/requests?model=${model}&timespan=${timespan}&granularity=${granularity}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            const data = await response.json();
            setData(data.requests);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [timespan,granularity]);

    return (
        <AreaChart x={data.timestamp} y={data.count_} title={`Total Requests (${timespan})`} x_label={`Timestamp (${granularity})`} y_label="Count" rangeselector={rangeselector} />
    );
}