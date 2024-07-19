import React, { useEffect, useRef, useState } from 'react';
import Popup from 'reactjs-popup';
import '../../gdk/css/geico-design-kit.css';
import '../cards/cards.css';
import Accordion from '../Accordion';
import DataQualityMetricsTable from "../widgets/DataQualityMetricsTable";
import FeatureHistogramPlot from "../widgets/FeatureHistogramPlot";

// This function handles displaying a green checkmark or a red alert icon (depending on values in appropriate fields)
// Along with the icon, a popup window with a detailed info is displyed at the hover action 
// It handles icons and popups for the Validation and Anomaly Check columns
function PopupComponent({ success, details }) {
    let popupContent;
    if (details) {
        const parsedDetails = JSON.parse(details);
        popupContent = JSON.stringify(parsedDetails, null, 2);
    }
    const contentStyle = { background: 'white', padding: '10px', color: 'black' };
    const delay = 200;
    if ((success == "true") && popupContent) {
        return (
            <Popup
                trigger={<span className="icon-check-mark" style={{ verticalAlign: "text-bottom", color: "#66BB6A" }} />}
                position="bottom center"
                mouseEnterDelay={delay}
                mouseLeaveDelay={delay}
                on="hover"
                contentStyle={contentStyle}
                closeOnDocumentClick>
                <div><pre>{popupContent}</pre></div>
            </Popup >
        );
    }
    if ((success == "false") && popupContent) {
        return (
            <Popup
                trigger={<span className="icon-alert" style={{ verticalAlign: "text-bottom", color: "red" }} />}
                position="bottom center"
                mouseEnterDelay={delay}
                mouseLeaveDelay={delay}
                on="hover"
                contentStyle={contentStyle}
                closeOnDocumentClick>
                <div><pre>{popupContent}</pre></div>
            </Popup>
        );
    }
}

export default function DataDriftDetailsCard({ detailsRow }) {
    const [dictForHist, setDictForHist] = useState();
    const [dataQualityMetrics, setDataQualityMetrics] = useState();
    const [anomalSuccess, setAnomalSuccess] = useState(null);
    const [dates, setDates] = useState({ startDate: null, endDate: null});
    const ref = useRef(null);

    const processDetails = () => {
        try {
            // extract dates
            const startDate = detailsRow.start_date;
            const endDate = detailsRow.end_date;
            setDates({ startDate: startDate, endDate: endDate });

            // set dictForHist
            const jsonForHist = JSON.parse(detailsRow?.json_for_hist);
            jsonForHist.sort((a, b) => (a.x - b.x));
            const dictForHist = {};
            dictForHist.current = jsonForHist.map(item => item.current);
            dictForHist.reference = jsonForHist.map(item => item.reference);
            dictForHist.items = jsonForHist.map(item => item.x);
            setDictForHist(dictForHist);

            // set dataQualityMetrics
            const dataQualityMetrics = JSON.parse(detailsRow?.data_quality_metrics);
            setDataQualityMetrics(dataQualityMetrics);

            // check condition and setAnomalSuccess
            const anomal_data = JSON.parse(detailsRow?.anomal_data);
            if (anomal_data) {
                if (anomal_data.anomaly_count == 0) {
                    setAnomalSuccess("true");
                }
                else {
                    setAnomalSuccess("false");
                }
            }

        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        if (ref.current) {
            const top = ref.current.getBoundingClientRect().top;
            const offset = ref.current.offsetTop;
            const inView = top + offset >= 0 && top - offset <= window.innerHeight;
            if (inView) {
                processDetails();
            }
        }
    }, [detailsRow]);

    return (
        <>
            <div className='data_drift_details_row' ref={ref} id={detailsRow?.feature + "-details"}>
                <Accordion innerContents={
                    <div style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{ width: '50%' }}>
                            <DataQualityMetricsTable data={dataQualityMetrics} ftrType={detailsRow?.type} />
                        </div>

                        <div style={{ width: "50%" }}>
                            <FeatureHistogramPlot items={dictForHist?.items} current={dictForHist?.current}
                                reference={dictForHist?.reference} start_date={dates.startDate} end_date={dates.endDate} plotHeight="100%" />
                        </div>
                    </div>
                }
                    outerContents={
                        <div style={{ display: "flex", width: "95%" }} >
                            <div style={{ flex: 1 }}>
                                <h5>Feature</h5>
                                <p>{detailsRow?.feature}</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h5>Type</h5>
                                <p>{detailsRow?.type}</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h5>Feature Drift</h5>
                                {detailsRow ? (
                                    <p>{detailsRow?.drift_detected == "True" ? "DETECTED" : "NOT Detected"}</p>
                                ) : (
                                    <p>...</p>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h5>Threshold</h5>
                                <p>{detailsRow?.threshold}</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h5>Validation</h5>
                                <p>
                                    <PopupComponent
                                        success={detailsRow?.validation_success}
                                        details={detailsRow?.validation_details} />
                                </p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h5>Stat Test</h5>
                                <p>{detailsRow?.stattest_name}</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h5>Drift Score</h5>
                                {detailsRow ? (
                                    <p>{parseFloat(detailsRow?.drift_score).toFixed(6)}</p>
                                ) : (
                                    <p>...</p>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h5>Anomaly Check</h5>
                                <p>
                                    <PopupComponent
                                        success={anomalSuccess}
                                        details={detailsRow?.anomal_data} />
                                </p>
                            </div>
                        </div>
                    } />
            </div>
        </>
    );
}
