import { useEffect, useState } from "react";
import { ColorRing } from 'react-loader-spinner';
import DriftAlgorithmSelector from './DriftAlgorithmSelector';
import DateRangeSelector from './DateRangeSelector';
import EarlierLogsVsBaseSelector from './EarlierLogsVsBaseSelector';
import './panelBar.css';

/**
 * A component that serves as a container for various selectors in a data drift panel.
 * 
 * @param {function} onRun - The function to call once the "run report" button is clicked
 * @returns {JSX.Element} A react component
 */
export default function PanelBar({ onRun, loading, runJobStatus, showDriftAlgSelector = false, algorithmList }) {

    const [endDate, setEndDate] = useState();
    const [startDate, setStartDate] = useState();
    const [customAlgorithm, setCustomAlgorithm] = useState();
    const [logsVsBase, setLogsVsBase] = useState("Base Dataset");
    const [prvLogsStartDate, setPrvLogsStartDate] = useState();
    const [prvLogsEndDate, setPrvLogsEndDate] = useState();
    const [errorMessage, setErrorMessage] = useState("");

    const onRunReport = (event) => {
        if (!startDate && !endDate){
            setErrorMessage("Start and End date can't be empty");
        } 
        else if (startDate && !endDate ){
            setErrorMessage("End date is not selected");
        }
        else if (!startDate && endDate){
            setErrorMessage("Start date is not selected");
        }
        else if (startDate > endDate ){
            setErrorMessage("Start date can't be after the End date");
        }     
        else {
            event.preventDefault();
            setErrorMessage("");
            onRun(startDate, endDate, customAlgorithm, prvLogsStartDate, prvLogsEndDate);
        }
    }
    
    useEffect(() => {
        if (logsVsBase=="Base Dataset"){
            setPrvLogsStartDate("");
            setPrvLogsEndDate("");
        }
    }, [logsVsBase])

    
    const rendorIconOrSpinner = () => {
        if (loading) {
            return <ColorRing visible={true} height="50" width="50" ariaLabel="blocks-loading" />;
        } else if (runJobStatus) {
            return (
                <>
                    <div className="geico-icon" style={{marginTop: "-15px"}}>
                        <a href="#" aria-label="Run report" onClick={onRunReport}
                            title="Run report" className="geico-icon geico-icon--actionable icon-turn"></a>
                    </div>
                    <div>{ `Job ${runJobStatus}`}</div>
                </>
            );
        } else {
            return (
                <div className="geico-icon" style={{marginTop: "-15px"}}>
                    <a href="#" aria-label="Run report" onClick={onRunReport}
                        title="Run report" className="geico-icon geico-icon--actionable icon-turn"></a>
                </div>
            );
        }
    };

    return (
        <>
            <div className="panel-bar-container">
                <DateRangeSelector onStartUpdate={setStartDate} onEndUpdate={setEndDate} errorMessage={errorMessage}/>

                {showDriftAlgSelector &&
                    <DriftAlgorithmSelector onUpdate={setCustomAlgorithm} algorithmList={algorithmList} />
                }

                <EarlierLogsVsBaseSelector onUpdate={setLogsVsBase} />

                {logsVsBase =="Earlier Logs" && 
                    <div>
                        <DateRangeSelector onStartUpdate={setPrvLogsStartDate} onEndUpdate={setPrvLogsEndDate} errorMessage={errorMessage}/>
                    </div>
                }
                <div> {rendorIconOrSpinner()} </div> 

            </div>
        </>
    );
}
