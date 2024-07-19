import React, { useState, useEffect } from 'react';

function TotalPrediction() {
    const [request, setRequest] = useState([]);

    const getTotalRequest = async () => {
        try {
            const response = await fetch('/api/metrics/totalrequests',
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            const data = await response.json();
            setRequest((data.requests[0]));
        } catch (error) {
            console.error(error);
        }
    };

    function formatNumber(num) {
        if (num >= 1000000)
            return Math.floor(num / 1000000) + 'M';
        else if (num >= 1000)
            return Math.floor(num / 1000) + 'K';
        else
            return num;
    }

    useEffect(() => {
        getTotalRequest();
    }, []);

    return (
        <div className="card" style={{ textAlign: 'center' }}>
            <div className="card-title">
                <h5>Predictions</h5>
            </div>
            <div className="card-body">
                <h4 style={{ marginBottom: "0" }}>{request ? formatNumber(request.total_count) : ""}</h4>
            </div>
        </div>
    );
}
export default TotalPrediction;