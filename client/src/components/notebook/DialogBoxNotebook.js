import { useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import DialogBoxSelector from "./DialogBoxSelector";

/**
 *A component that renders dialogue box.
 * @param {string} baselinePath notebook config args 
 * @param {string} comparisonPath notebook config args 
 * @param {string} featureNamesColumn notebook config args 
 * @param {string} targetsPath notebook config args 
 * @param {string} targetFormat notebook config args 
 * @param {string} notebookName notebook config args 
 * @param {string} buttonName notebook config args 
 * @param {function} onUpdate - The function to call when feature set selection was updated
 * @param {string} jobId - The job ID to use in DialogBoxSelector component
 * @param {string} model - The model to use in DialogBoxSelector component
 * @param {string} zone - The zone to use in DialogBoxSelector component
 * @param {string} type - The type to use in DialogBoxSelector component
 * @returns {JSX.Element} A react component
 */
export default function NotebookDialogueBox({
  baselinePath,
  comparisonPath,
  featureNamesColumn,
  targetsPath,
  targetFormat,
  notebookName,
  buttonName,
  model,
  type,
  jobId,
  zone
}) {
  const [selectorId, setSelectorId] = useState(Math.floor(Math.random() * 100));
  const [modalInstance, setModalInstance] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!modalInstance) {
      const modal = new GDK.Modal({
        content: "#modal-id" + selectorId,
        autoShow: false,
        onOpened: function () { },
        onClosed: function () { },
      });
      setModalInstance(modal);
    }
  }, []);

  const showModal = () => {
    if (modalInstance) {
      modalInstance.show();
    }
  };

  function getEmail() {
    var currentToken = localStorage.getItem("brille-token");
    var decodedToken = jwt_decode(currentToken);
    return decodedToken.username.toLowerCase();
  }

  const cloneNotebook = async (
    startDate,
    endDate,
    binningStrategy,
    featureSet
  ) => {
    try {
      const emailAddress = getEmail();
      const response = await fetch(
        `/api/clone_notebook?email=${emailAddress}&notebookName=${notebookName}&startDate=${startDate}&endDate=${endDate}&featureSet=${featureSet}&binningStrategy=${binningStrategy}&baselinePath=${baselinePath}&comparisonPath=${comparisonPath}&featureNamesColumn=${featureNamesColumn}&targetsPath=${targetsPath}&targetFormat=${targetFormat},`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
          }
        }
      );
      if (response.status == 200) {
        const data = await response.json();
        setMessage(true);
        window.open(
          `${data.url}/#notebook/${data.object_id}`,
          "_blank"
        );
      } else {
        setErrorMessage("unable to open notebook", response.message);
      }
    } catch (error) {
      console.log(error);
      setErrorMessage(error);
    }
  };

  function convertNanoToDateTime(nanoseconds) {
    const date = new Date(nanoseconds);
    return date.toISOString();
  }
  return (
    <div>
      <button type="button" className="btn btn--primary" onClick={showModal}>
        {buttonName}
      </button>
      <div id={"modal-id" + selectorId} className="modal">
        <div className="modal-container">
          <h2 className="modal-headline">{buttonName}</h2>
          <div className="modal-content">
            <div className="modal-content">
              {
                <DialogBoxSelector
                  onRun={cloneNotebook}
                  model={model}
                  zone={zone}
                  jobId={jobId}
                  type={type}
                />
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
