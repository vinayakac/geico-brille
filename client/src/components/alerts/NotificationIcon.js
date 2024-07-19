import { useEffect, useState } from 'react';
import { useUser } from '../../utils/auth/useUser';

/**
 * This component displays a notification icon and updates its appearance based
 * on the latest alert data.
 * @returns {JSX.Element} A react component
 */

export default function NotificationIcon() {
    const [errorMessage, setErrorMessage] = useState(null);
    const [alertData, setAlertData] = useState();
    const user = useUser();

    const fetchUnreadAlerts = async () => {
        try {
            const userId = user.username.toLowerCase();
            const response = await fetch(`/api/alerts/unseen?userId=${userId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                }
            });

            if (!response.ok) {
                setErrorMessage("No alert found");
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setAlertData(data.length);
        } catch (error) {
            console.error(error);
            setErrorMessage(error);
        }
    }

    const handleSeenAlerts = async () => {
        try {
            const userId = user.username.toLowerCase();
            const url = `/api/alerts/update_seen_status?userId=${userId}`;
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
            }
            fetchUnreadAlerts();

        } catch (error) {
            console.error(error);
            setErrorMessage(error);
        }

    }
    useEffect(() => {
        fetchUnreadAlerts();
    }, []);

    return (
        <>
            <a data-side-panel-trigger="notifications" href="/">
                {alertData > 0 && (
                    <span className="alert-count" style={{
                        backgroundColor: 'red',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '0.2em 0.5em',
                        fontSize: '0.8em',
                        position: 'absolute',
                        top: '3px',
                        right: '186px',
                    }}>
                        {alertData}
                    </span>
                )}
                <span aria-label="notifications" className="icon-notifications" onClick={() => handleSeenAlerts()}></span>
                <span className="header-link header-hover-link"></span>
            </a>
        </>
    );
}