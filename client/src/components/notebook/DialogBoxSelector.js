import { Component, useEffect, useState } from "react";
import DateRangeSelector from "../panelbar/DateRangeSelector";
import FeatureSetSelector from "../panelbar/FeatureSetSelector";
import BinningStrategySelector from "../panelbar/BinningStrategySelector";
import "./notebook.css";

/**
 * A component that serves as a various data analysis.
 *
 * @param {function} onRun - The function to call once the "run report" button is clicked
 * @param {string} jobId - The job ID to use in DialogBoxSelector component
 * @param {string} model - The model to use in DialogBoxSelector component
 * @param {string} zone - The zone to use in DialogBoxSelector component
 * @param {string} type - The type to use in DialogBoxSelector component
 * @returns {JSX.Element} A react component
 */
export default function DialogBoxSelector({ onRun, model, jobId, zone, type }) {
  const [endDate, setEndDate] = useState();
  const [startDate, setStartDate] = useState();
  const [featureSet, setFeatureSet] = useState();
  const [binningStrategy, setBinningStrategy] = useState();
  const [errorMessage, setErrorMessage] = useState("");

  const handleLaunchNotebook = (event) => {
    if (!startDate && !endDate) {
      setErrorMessage("Start and End date can't be empty");
    } else if (startDate && !endDate) {
      setErrorMessage("End date is not selected");
    } else if (!startDate && endDate) {
      setErrorMessage("Start date is not selected");
    } else if (startDate > endDate) {
      setErrorMessage("Start date can't be after the End date");
    } else {
      event.preventDefault();
      onRun(startDate, endDate, binningStrategy, featureSet);
    }
  };
  return (
    <>
      <div className="dialogbox-container">
        <DateRangeSelector
          onStartUpdate={setStartDate}
          onEndUpdate={setEndDate}
          errorMessage={errorMessage}
        />
        <FeatureSetSelector
          onUpdate={setFeatureSet}
          model={model}
          type={type}
          zone={zone}
          jobId={jobId}
        />
        <BinningStrategySelector onUpdate={setBinningStrategy} />
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleLaunchNotebook}
          style={{ justifyContent: "right" }}
        >
          Launch Notebook
        </button>
      </div>
    </>
  );
}
