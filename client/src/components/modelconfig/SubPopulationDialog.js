import { useState, useEffect } from "react";
import FeatureSelector from "../panelbar/FeatureSelector";
import Tooltip from '../../components/Tooltip.js';
import './subPopulation.css'
/**
* A component that renders dialogue box to add sub population tracking
* @param { string } model - Model name
* @param {function} onDone - The function to add selected feature and values to subPopulations object
* @param {object} requestFeats - The request features and their types
* @returns { JSX.Element } A react component
*/
export const SubPopulationDialog = ({ modelConfig, onDone, requestFeats, subType=None}) => {
    const [selectorId, setSelectorId] = useState(subType + Math.floor(Math.random() * 10000));
    const [modalInstance, setModalInstance] = useState(null);
    const [selectedFeature, setSelectedFeature] = useState("");
    // Map of value to boolean flag that indicated if it's selected
    const [valueBins, setValueBins] = useState({});
    const [valueBinsStr, setValueBinsStr] = useState("");
    const [requestParameters, setRequestParameters] = useState({});
    const [reqParam, setReqParam] = useState("");
    const [reqPlsFeat, setReqPlsFeat] = useState([]);

    useEffect(() => {
        if (!modalInstance) {
            const modal = new GDK.Modal({
                content: "#modal-id" + selectorId,
                autoShow: false
            });
            setModalInstance(modal);
        }
    }, []);

    const showModal = () => {
        if (modalInstance) {
            modalInstance.show();
        }
        var tabs = new GDK.Tabs({
            content: "#modal-tabs" + selectorId,
        });
    };

    const updateSelection = (feature, value) => {
        setSelectedFeature(feature);
        setValueBins(value);
    }

    const addSubPopulation = () => {
        let parsedStr = valueBins;
        if (valueBinsStr.length != 0) {
            const parsedObj = valueBinsStr.split(",").map(val => val.trim());
            parsedStr = parsedObj.reduce((a, v) => ({ ...a, [v]: true }), valueBins);
        }
        if (selectedFeature) {
            onDone(selectedFeature, parsedStr); }
        setSelectedFeature("");
        setValueBins({});
        setValueBinsStr("");
        setReqParam("");
        modalInstance.hide();
    }

    const handleParamChange = (e) => {
        const selectedOption = e.target.value;
        setReqParam(selectedOption);
        setSelectedFeature(selectedOption);
        setValueBinsStr("");
        setValueBins({});
    }

    useEffect(() => {
        if (requestFeats) {
            const reqFeats = {};
            Object.keys(requestFeats).forEach(type => {
                const simplifyType = type.startsWith("num") ? "num" : "cat";
                requestFeats[type].forEach(feat => {
                    reqFeats[feat.toLowerCase()] = simplifyType;
                })
            })
            setRequestParameters(reqFeats);
        }
    }, [requestFeats]);

    useEffect(() => {
        if (requestParameters){
            const reqParms = Object.keys(requestParameters);
            setReqPlsFeat(reqParms);
        }
    },[requestParameters]);

    return (
        <div>
            <div onClick={() => showModal()} style={{ display: 'flex', textAlign: "left" }}>
                <span style={{ fontWeight: 'bold', marginRight: '2px', lineHeight: "16px", paddingBottom: "6px" }}>
                    Add {subType} Subpopulation
                </span>
                <span className="geico-icon geico-icon--small geico-icon--actionable icon-expand"></span>
            </div>
            <div id={"modal-id" + selectorId} className="modal">
                <div className="modal-container subpopulation-modal-container" >
                    <h5 className="modal-headline" style={{ alignContent: "center" }}>Add {subType} Subpopulation Tracking </h5>
                    <div className="modal-content">
                        <div id={"modal-tabs" + selectorId} className="tabs">
                            <div className="tabs-container" style={{ display: 'flex'}}>
                                <a id="feature-tab" className="tab" href="#" role="tab" aria-controls="feature-panel">
                                    <span>Feature</span>
                                </a>
                                {reqPlsFeat && reqPlsFeat.length > 0 && (
                                    <a id="request-tab" className="tab" href="#" role="tab" aria-controls="request-panel">
                                        <span>Request Parameters</span>
                                    </a>
                                )}
                            </div>
                            <div id="feature-panel" className="panel" role="tabpanel" aria-labelledby="feature-tab">
                                    <FeatureSelector onUpdate={updateSelection}
                                        model={modelConfig?.model_name} zone={modelConfig?.zone}
                                        jobId={modelConfig?.jobsMap?.drift} type={"drift"} id={selectorId} />
                            </div>
                            {reqPlsFeat && reqPlsFeat.length > 0 && (
                            <div id="request-panel" className="panel" role="tabpanel" aria-labelledby="request-tab">
                                <div className="select-box panel-bar-selector" style={{ display: 'flex', alignItems: 'center', marginBottom: "4px" }}>
                                    <label htmlFor="request_param" className="feature-selector"
                                        style={{ padding: "10px", fontWeight: 500, marginRight: '70px' }}>
                                        Select Request Parameter:
                                        <select id="request_param" 
                                                name="request_param" 
                                                value={reqParam} 
                                                onChange={handleParamChange}
                                                style={{ width: '500px', height: '60px' }}>
                                            <option value="">--request parameter--</option>
                                            {reqPlsFeat.map((feature, index) => (
                                                <option key={index}>{feature}</option>
                                            ))}
                                        </select>
                                    </label>

                                </div>
                                <div style={{ margin: "10px", fontWeight: 500, marginRight: '70px' }}>Request Feature Type: {requestParameters[reqParam]}</div>
                                <div style={{ display: "flex", padding: '10px' }}>
                                    <label htmlFor="request_valuebins" className="text"
                                        style={{ margin: "10px", fontWeight: 500 }}>
                                        <div className="subpopulation-tooltip-container">
                                            Comma separated values:
                                            <Tooltip text="Input values should be separated by semicolons. 
                                            Accepted input style for catagorical feature: spring, fall, summer.
                                            For numeric feature: 1, 2, 4:5, 0-3. 
                                            If range provided, the data will be filtered to include values that are equal to and fall within that range."/>
                                        </div>
                                        <input id="request_valuebins"
                                            name="request_valuebins"
                                            value={valueBinsStr}
                                            onChange={e => setValueBinsStr(e.target.value)}
                                            type="text" 
                                            size="30" 
                                            style={{ width: '500px', height: '50px' }}
                                            />
                                    </label>
                                </div>
                            </div>
                            )}
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={() => addSubPopulation()}
                                style={{ justifyContent: "right", width: "fit-content", display: "flex" }}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}