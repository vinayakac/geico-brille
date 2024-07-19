
import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '../../utils/auth/useUser';

/**
 * A component that renders the latest alerts and 
 * @returns {JSX.Element} A react component
 */
export default function LatestAlertsPanel() {
    const [alertData, setAlertData] = useState([]);
    const [message, setMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const user = useUser();

    const fetchLatestAlerts = async () => {
        try {
            const userId = user.username.toLowerCase();
            const response = await fetch(`/api/alerts/active?userId=${userId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                }
            });

            if (!response.ok) {
                setErrorMessage("No alert found");
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.length > 0) {
                const filteredResponse = data.map(item => ({
                    id: item.id,
                    userId: item.userId,
                    snapshotDateTime: item.snapshotDateTime,
                    alertName: item.alerts.alertName,
                    modelName: item.alerts.modelName,
                    featureName: item.alerts.featureName,
                    alertValue: item.alerts.alertValue
                }));
                return filteredResponse;
            } else {
                setMessage("No alert found");
                return [];
            }

        } catch (error) {
            console.error(error);
            setErrorMessage(error);
        }
    }


    const formatRelativeTime = (t) => {
        return formatDistanceToNow(new Date(t), { addSuffix: true });
    }

    function formatAlertName(alertName) {
        return alertName
            .replace(/[-,_]/g, ' ')
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    const formatAlertValue = (value) => {
        if (typeof value === "number" || !isNaN(Number(value))) {
            return parseFloat(value).toFixed(3);
        }
        return value;
    }
    const handleCloseAlerts = async (id, alertName, modelName) => {
        const userId = user.username.toLowerCase();
        try {
            const url = `/api/alerts/update_removed_status?id=${id}&alertName=${alertName}&modelName=${modelName}&userId=${userId}`;
            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                }
            });

            if (!response.ok) {
                setErrorMessage("No alert found");
                throw new Error(`HTTP error! status: ${response.status}`);
            } else {
                fetchDataAndFilter();
            }

        } catch (error) {
            console.error(error);
            setErrorMessage(error);
        }

    }

    const fetchDataAndFilter = async () => {
        const fetchedAlerts = await fetchLatestAlerts();
        const sortedData = fetchedAlerts.sort((a, b) => new Date(b.snapshotDateTime) - new Date(a.snapshotDateTime));
        setAlertData(sortedData);
    };

    useEffect(() => {
        fetchDataAndFilter();
    }, []);
    return (
        <div>
            {message ? (
                <div style={{ alignItems: "center", display: "flex" }} className="message-style"><strong>{message}</strong></div>
            ) : (alertData.length > 0 ?
                alertData.map((alert, index) => (
                    <div
                        key={`${alert.alertName}-${alert.modelName}-${alert.snapshotDateTime}`}
                        className="alert--high-importance"
                    >
                        <div className="alert-header" style={{ fontWeight: "bold", fontSize: "1.2em" }}>
                            <div className="icon-alert" style={{ marginRight: "10px" }}> </div>
                            {formatAlertName(alert.alertName)}

                            <button onClick={() => handleCloseAlerts(alert.id, alert.alertName, alert.modelName)}
                                className="btn-close icon-close"
                                type="button"
                                style={{ marginLeft: "10px" }}
                            />
                        </div>
                        <div className="alert-body">
                            <p>{"model " + alert.modelName + " shows " + formatAlertValue(alert.alertValue) + " for feature: " + alert.featureName}</p>
                        </div>
                        <div className="alert-timestamp">
                            {formatRelativeTime(alert.snapshotDateTime)}
                        </div>
                        <hr />
                    </div>
                ))
                : <div style={{ alignItems: "center", display: "flex" }}> <strong>No alerts found </strong></div>)}
        </div>
    );
}