import { useState, useEffect } from "react";
import { useUser } from '../../utils/auth/useUser';
import UpdateAlertsPanel from "./UpdateAlertsPanel";

/**
 *A component that renders dialogue box for updating alerts.
 * @param {string} model - Model name the alert belongs to
 * @param {string} alertId - Id of the alert
 * @param {string} alertName - Name of the alert
 * @param {Function} refreshAlertsData - Function to refresh the data after update action 
 * @returns {JSX.Element} A react component
 */
export default function UpdateAlertsDialogueBox({ alertId, alertName, alertOwner, refreshAlertsData, model }) {
    const [selectorId, setSelectorId] = useState(Math.floor(Math.random() * 100));
    const [modalInstance, setModalInstance] = useState(null);
    const [refreshKey, setRefreshKey] = useState(Math.random());
    const user = useUser();

    useEffect(() => {
        if (!modalInstance) {
            const modal = new GDK.Modal({
                content: "#modal-id" + selectorId,
                autoShow: false,
                onOpened: function () { },
                onClosed: function () { setRefreshKey(Math.random()); },
            });
            setModalInstance(modal);
        }
    }, []);

    const showModal = () => {
        if (user.username.toLowerCase() == alertOwner) {
            if (modalInstance) {
                modalInstance.show();
            }
        } else {
            alert("you don't have permission to edit this alert");
        }
    };

    return (
        <div>
            <div onClick={() => showModal()}>
                <span className="geico-icon geico-icon--small geico-icon--actionable icon-edit"></span>
            </div>
            <div id={"modal-id" + selectorId} className="modal">
                <div className="modal-container">
                    <h2 className="modal-headline">Edit Alert for {alertName}</h2>
                    <div className="modal-content">
                        {<UpdateAlertsPanel
                            key={refreshKey}
                            alertId={alertId}
                            refreshAlertsData={refreshAlertsData}
                            model={model}
                        />}
                    </div>
                </div>
            </div>
        </div>
    );
}
