import { useState, useEffect } from "react";
import AddAlertsPanel from "./AddAlertsPanel";
import jwt_decode from 'jwt-decode';

/**
 *A component that renders dialogue box to add alerts
 * @param {string} model - Model name the alert belongs to
 * @returns {JSX.Element} A react component
 */
export default function AddAlertsDialogueBox({ refreshAlertsData, model }) {
    const [selectorId, setSelectorId] = useState(Math.floor(Math.random() * 100));
    const [modalInstance, setModalInstance] = useState(null);
    const [refreshKey, setRefreshKey] = useState(Math.random());
    const [user, setUser] = useState(null);

    function getUser() {
        var currentToken = localStorage.getItem('brille-token');
        var decodedToken = jwt_decode(currentToken);
        setUser(decodedToken.username.toLowerCase());
    }

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

        getUser()
    }, []);

    const showModal = () => {
        if (modalInstance) {
            modalInstance.show();
        }
    };

    return (
        <div>
            <div onClick={() => showModal()} style={{ display: 'flex', textAlign: "left" }}>
                <p style={{ fontWeight: 'bold', marginRight: '2px' }}>Add</p>
                <span className="geico-icon geico-icon--small geico-icon--actionable icon-expand"></span>
            </div>
            <div id={"modal-id" + selectorId} className="modal">
                <div className="modal-container">
                    <h2 className="modal-headline">Add New Alert</h2>
                    <div className="modal-content">
                        {<AddAlertsPanel
                            key={refreshKey}
                            refreshAlertsData={refreshAlertsData}
                            model={model}
                            user={user}
                        />}
                    </div>
                </div>
            </div>
        </div>
    );
}
