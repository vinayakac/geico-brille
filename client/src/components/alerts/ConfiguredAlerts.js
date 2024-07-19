import "./Alerts.css";
import { useState, useEffect } from "react";
import { useUser } from '../../utils/auth/useUser';
import UpdateAlertsPanel from "./UpdateAlertsPanel";
import AddAlertsPanel from "./AddAlertsPanel";

/**
 *A component that renders configured alerts.
 * @param {string} model - Model name the alert belongs to
 * @returns {JSX.Element} A react component
 */

export default function ConfiguredAlerts({ model }) {
  const [alertData, setAlertData] = useState([]);
  const [message, setMessage] = useState(null);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [currentAlertName, setCurrentAlertName] = useState(null);
  const [isUpdated, setIsUpdated] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [editDrawer, setEditDrawer] = useState(false);
  const [addDrawer, setAddDrawer] = useState(false);

  const user = useUser();

  const openEditDrawer = (alertOwner) => {
    if (alertOwner == user.username.toLowerCase()) {
      setEditDrawer(true);
    } else {
      alert("You don't have permission to edit the alert!")
    }
  }

  const openAddDrawer = () => {
    setAddDrawer(true);
  }

  const closeDrawer = () => {
    setAddDrawer(false);
    setEditDrawer(false);
  }

  const handleCurrentAlert = (alertName, alertId, adminEmail) => {
    setCurrentAlertName(alertName);
    setCurrentAlert(alertId);
    openEditDrawer(adminEmail)
  }

  const refreshAlertsData = (actionName) => {
    setIsUpdated(true);
    alert(`${actionName} successfully`);
  }

  const fetchAlertDetails = async () => {
    try {
      const response = await fetch(`/api/alerts/config/user?user=${user.username.toLowerCase()}&partitionKey=${model}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
          }
        });
      if (!response.ok) {
        setMessage("No alert configuration found");
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let data = await response.json();
      if (data.length > 0) {
        setAlertData(data);
      } else {
        setMessage("No alert configuration found");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    }
  };

  const deleteAlert = async (alertName, alertId, currentAlertOwner) => {
    try {
      if (user.username.toLowerCase() === currentAlertOwner) {
        const userConfirmed = window.confirm(`Are you sure you want to delete ${alertName}?`)
        if (userConfirmed) {
          const response = await fetch(`/api/alerts/config/delete?id=${alertId}&partitionKey=${model}`, {
            method: "DELETE",
            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
          });

          if (!response.ok) {
            const responseBody = await response.json();
            throw new Error(`Error: ${response.status}, ${responseBody.message || ''}`);
          } else {
            refreshAlertsData("Alert deleted");
          }
        }
      } else {
        alert("You don't have permission to delete this alert.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(`An error occurred while deleting the alert: ${error.message}`);
    }
  };


  const handleDelete = (alertName, alertId, currentAlertOwner) => {
    deleteAlert(alertName, alertId, currentAlertOwner);
  }

  useEffect(() => {
    fetchAlertDetails();
    setIsUpdated(false);
  }, [isUpdated]);

  return (
    <>
      <div style={{ display: 'flex', marginLeft: '50px' }}>
        <p style={{ fontWeight: 'bold', marginRight: '50px' }}>Configured Alerts</p>
        <div onClick={openAddDrawer} style={{ display: 'flex', marginLeft: '50px' }}>
          <span style={{ marginTop: "3.4px" }} className="geico-icon geico-icon--small geico-icon--actionable icon-expand"></span>
          <p style={{ fontWeight: 'bold' }}>New Alert</p>
        </div>
      </div >
      {addDrawer && (
        <div className="edit-drawer-wrapper" style={{ overflowY: 'auto' }}>
          <div className="edit-drawer-bg" ></div>
          <AddAlertsPanel
            refreshAlertsData={refreshAlertsData}
            model={model}
            user={user}
            closeDrawer={closeDrawer}
          />
        </div >
      )}
      <div className="configured-alerts">
        {message ? (
          <div style={{ marginLeft: '50px' }}>{message}</div>
        ) : (
          <div className="data-table sticky-two-column">
            <table id="table-id" className="table">
              <thead>
                <tr>
                  <th>Alert Name</th>
                  <th>Alert Description</th>
                  <th>Alert Signal</th>
                  <th>Alert Condition</th>
                  <th>Alert Threshold</th>
                  <th>Alert Owner</th>
                  <th>Alert Action</th>
                  <th>Alert Emails</th>
                  <th>Alert Enabled</th>
                  <th>Alert Updated Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alertData.map((alert, index) => (
                  <tr key={index}>
                    <td style={{ width: '600px' }} >{alert.alertName}</td>
                    <td style={{ width: '600px' }} >{alert.description}</td>
                    <td className="alerts-no-wrap" >{alert.alertSignal}</td>
                    <td className="alerts-no-wrap" >{alert.alertCondition}</td>
                    <td className="alerts-no-wrap" >{alert.alertThreshold.toString()}</td>
                    <td className="alerts-no-wrap" >{alert.alertAction}</td>
                    <td className="alerts-no-wrap" >{alert.adminEmail}</td>
                    <td style={{ width: '600px' }} >{alert.alertEmails + " "}</td>
                    <td className="alerts-no-wrap">{alert.alertEnabled.toString()}</td>
                    <td className="alerts-no-wrap">{alert.lastUpdatedDateTime}</td>
                    <td className="col--edit-control">
                      <div onClick={() => handleCurrentAlert(alert.alertName, alert.id, alert.adminEmail)}>
                        <span className="geico-icon geico-icon--small geico-icon--actionable icon-edit"></span>
                      </div>

                      <div onClick={() => { handleDelete(alert.alertName, alert.id, alert.adminEmail) }}>

                        <span className="geico-icon geico-icon--small geico-icon--actionable icon-trash"></span>
                      </div>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editDrawer && (
        <div className="edit-drawer-wrapper" style={{ overflowY: 'auto' }}>
          <div className="edit-drawer-bg" ></div>
          <UpdateAlertsPanel
            alertId={currentAlert}
            alertName={currentAlertName}
            refreshAlertsData={refreshAlertsData}
            model={model}
            closeDrawer={closeDrawer}
          />

        </div >
      )}

    </>
  );
}
