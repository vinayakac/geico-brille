import { useEffect, useState, useCallback, useMemo } from 'react';
import Tooltip from '../Tooltip.js';
import TripTrackerNode from './TripTrackerNode.js';
import DateRangeSelector from '../../components/panelbar/DateRangeSelector';
import { ExportButton } from '../ExportButton.js';
import '../../gdk/css/geico-design-kit.css';
import './pipeline.css';
import ReactFlow, {
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
} from 'reactflow';

export const PipelineLogSearch = () => {
    // define a dict for audit tables
    const auditTables = {
        "SDK": "SDK",
        "Trip Segment": "TripSegmentAudit",
        "Trip Aggregator": "TripAggregatorAudit",
        "Sensor Writer": "SensorWriterAudit",
        "Trip Summary": "TripSummaryAudit",
        "Trip Summary Writer": "TripSummaryWriterAudit",
        "BLT": "BLT"
    };
    let selectBoxItems = Object.keys(auditTables);
    selectBoxItems.unshift("All");
    const [component, setComponent] = useState("All");
    const [components, setComponents] = useState(selectBoxItems);
    const [tripSearch, setTripSearch] = useState("");
    const [driverSearch, setDriverSearch] = useState("");
    const [currStartDateStr, setCurrStartDateStr] = useState("");
    const [currEndDateStr, setCurrEndDateStr] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [wrap, setWrap] = useState(false);
    const [tripAllSegs, setTripAllSegs] = useState([]);
    const [tableSegsList, setTableSegsList] = useState([]);
    const [driverUniqTrips, setDriverUniqueTrips] = useState([]);
    const [tripStartTime, setTripStartTime] = useState("");
    const [tripEndTime, setTripEndTime] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasResult, setHasResult] = useState(true);
    const [isValidTrip, setIsValidTrip] = useState(true);
    const [loadingDriver, setLoadingDriver] = useState(false);
    const [hasResultDriver, setHasResultDriver] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);


    const formatAuditRecord = (record) => {
        const timestamp = new Date(record["_ts"]);
        let logMessage;
        if (record.container == "TripSegmentAudit") {
            logMessage = `Trip segment ${record.SegmentIndex} is ${record.RecordStatus} with code ${record.ProcessCode}`;
        } else if (record.container == "TripAggregatorAudit") {
            logMessage = `Trip segment ${record.SegmentIndex} is ${record.RecordStatus} with code ${record.ProcessCode}`;
        } else if (record.container == "SensorWriterAudit") {
            logMessage = `Trip segment ${record.SegmentIndex} is ${record.RecordStatus} with code ${record.ProcessCode}`;
        } else if (record.container == "TripSummaryAudit") {
            logMessage = `Trip segment ${record.SegmentIndex} is ${record.RecordStatus} with code ${record.ProcessCode}`;
        } else if (record.container == "TripSummaryWriterAudit") {
            logMessage = `${record.Message} (code ${record.ProcessCode})`;
        } else if (record.container == "BLT") {
            logMessage = `${record.Name} (OS ${record.OSCategory})`;
        } else if (record.container == "SDK") {
            logMessage = `Trip segment ${record.segmentIndex} is ${record.MESSAGE} with code ${record.OperationCode}`;
        }
        const paddedContainer = `[${record.container}]`.padEnd("[TripSummaryWriterAudit]".length, ' ');
        return `${timestamp.toUTCString()} ${paddedContainer} ${logMessage}`;
    };

    let accordion;
    useEffect(() => {
        if (accordion != undefined) {
            accordion.destroy();
        }
        accordion = new GDK.Accordion({
            "content": "#log-results-accordion"
        });
    }, [tableSegsList]);

    const initialNodes = [
        { type: 'pipeline', id: '1', position: { x: 0, y: 100 }, data: { label: 'SDK', status: "initial", isFinalSegmentAvailable: 'false', totalSegmentCount: 0, processedSegmentCount: 0, unprocessedSegmentCount: 0, pipelineComponent: 'SDK' } },
        { type: 'pipeline', id: '2', position: { x: 280, y: 100 }, data: { label: 'Trip Segment', status: "initial", isFinalSegmentAvailable: 'false', totalSegmentCount: 0, processedSegmentCount: 0, unprocessedSegmentCount: 0, pipelineComponent: "TripSegmentAudit" } },
        { type: 'pipeline', id: '3', position: { x: 565, y: 10 }, data: { label: 'Trip Aggregator', status: "initial", isFinalSegmentAvailable: 'false', totalSegmentCount: 0, processedSegmentCount: 0, unprocessedSegmentCount: 0, pipelineComponent: "TripAggregatorAudit" } },
        { type: 'pipeline', id: '4', position: { x: 565, y: 200 }, data: { label: 'Sensor Writer', status: "initial", isFinalSegmentAvailable: 'false', processedsuccessfully: '', pipelineComponent: "SensorWriterAudit" } },
        { type: 'pipeline', id: '5', position: { x: 860, y: 100 }, data: { label: 'Trip Summary', status: "initial", isFinalSegmentAvailable: 'false', processedsuccessfully: '', pipelineComponent: "TripSummaryAudit" } },
        { type: 'pipeline', id: '6', position: { x: 1140, y: 100 }, data: { label: 'Trip Summary Writer', status: "initial", isFinalSegmentAvailable: 'false', processedsuccessfully: '', pipelineComponent: "TripSummaryWriterAudit" } },
        { type: 'pipeline', id: '7', position: { x: 1415, y: 137 }, data: { label: 'BLT', status: "initial", pipelineComponent: "BLT" } },
    ];
    const initialEdges = [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
        { id: 'e2-4', source: '2', target: '4', animated: true },
        { id: 'e4-5', source: '4', target: '5', animated: true },
        { id: 'e3-5', source: '3', target: '5', animated: true },
        { id: 'e5-6', source: '5', target: '6', animated: true },
        { id: 'e6-7', source: '6', target: '7', animated: true },
    ];
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const nodeTypes = useMemo(() => ({ pipeline: TripTrackerNode }), []);
    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const driveridHandleKeyPress = async () => {
        try {
            setLoadingDriver(true);
            setHasResultDriver(true);

            const fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                }
            };

            // Define requests
            const DIRequest = {
                ...fetchOptions,
                body: JSON.stringify({
                    driverId: driverSearch,
                    startDate: currStartDateStr,
                    endDate: currEndDateStr
                })
            };

            const BLTRequest = {
                ...fetchOptions,
                body: JSON.stringify({
                    driverId: driverSearch,
                    startDate: currStartDateStr,
                    endDate: currEndDateStr
                })
            };

            const SDKRequest = {
                ...fetchOptions,
                body: JSON.stringify({
                    Id: driverSearch,
                    startDate: currStartDateStr,
                    endDate: currEndDateStr,
                    logTable: "GEICO_SDK_LOGGING_INFO"
                })
            };

            // Perform API calls sequentially
            const DIResponse = await fetch('/api/telematics/di/di_search_by_driverId', DIRequest);
            const DIData = await DIResponse.json();

            const BLTResponse = await fetch('/api/telematics/blt/blt_search_by_driverId', BLTRequest);
            const BLTData = await BLTResponse.json();

            const SDKResponse = await fetch('/api/telematics/sdk/sdk_driver_search', SDKRequest);
            const SDKData = await SDKResponse.json();

            // Extract TRIP_IDs from SDKData
            const sdkTripIds = extractCurrentTripIds(SDKData);
            const diTripIds = DIData.map(item => item.TripID);
            const bltTripIds = BLTData.map(item => item.tripID);

            // Combine and filter unique Trip IDs from all sources
            let combinedTripIds = [...diTripIds, ...bltTripIds, ...sdkTripIds];
            const uniqueTripIds = combinedTripIds.filter((item, index, arr) => arr.indexOf(item) === index);
            uniqueTripIds.sort();

            setDriverUniqueTrips(uniqueTripIds);

            if (uniqueTripIds.length === 0) {
                setHasResultDriver(false);
            }
            setLoadingDriver(false);
        } catch (error) {
            console.error(error);
            setLoadingDriver(false);
            setHasResultDriver(false);
        }
    };

    const extractCurrentTripIds = (SDKData) => {
        return SDKData.map((d) => {
            try {
                const message = JSON.parse(d["Message.serviceResults.OperationEvents"]);
                const detailsList = message.flatMap(event => event.Details);
                const currentTripIdDetail = detailsList.find(detail => detail.Key === "CURRENT_TRIP_ID");
                return typeof currentTripIdDetail?.Value === "string" ? currentTripIdDetail.Value : null;
            } catch (error) {
                console.error("Error parsing SDK data:", error);
                return null;
            }
        }).filter(id => id !== null);
    };

    function preprocessingSDKData(SDKData) {
        // Filter data if segmentIndex is in details
        const filteredData = SDKData.filter((d) => {
            try {
                const message = JSON.parse(d["Message.serviceResults.OperationEvents"]);
                const detailsList = message[0]["Details"];
                const details = detailsList.find((detail) => detail.Key === "DETAILS").Value;
                return typeof (details) === "string";
            } catch (error) {
                console.error("Error parsing JSON data", error);
                return false;
            }
        });

        // Processing SDK data
        let processedSDKData = [];
        filteredData.forEach((d) => {
            let row = {};
            row["container"] = "SDK";
            row["Region"] = d["Region"];

            try {
                // Preprocess message
                const message = JSON.parse(d["Message.serviceResults.OperationEvents"]);
                row["timestamp"] = d["Message.timestamp"];
                row["ApplicationName"] = message[0]["ApplicationName"];
                row["ApplicationVersion"] = message[0]["ApplicationVersion"];
                row["MobileClientId"] = message[0]["MobileClientId"];
                row["OperationCode"] = message[0]["OperationCode"];
                row["ProcessCode"] = row["OperationCode"] === "GEICO_SDK_LOGGING_ERROR" ? 500 : 200;
                row["_ts"] = message[0]["OperationTime"];

                // Preprocess details
                const detailsList = message[0]["Details"];
                row["MESSAGE"] = (detailsList.find((detail) => detail.Key === "MESSAGE") || {}).Value || "";
                row["SDK_VERSION"] = (detailsList.find((detail) => detail.Key === "SDK_VERSION") || {}).Value || "";
                row["TAG"] = (detailsList.find((detail) => detail.Key === "TAG") || {}).Value || "";

                // Extract trip ID
                const currentTripId = (detailsList.find((detail) => detail.Key === "CURRENT_TRIP_ID") || {}).Value || "";
                const details = (detailsList.find((detail) => detail.Key === "DETAILS") || {}).Value || "";
                const processedDetails = details.split(/[\s_]+/);

                const tripIdIndex = processedDetails.indexOf("tripId") + 1;
                row["TripID"] = tripIdIndex > 0 && processedDetails.length > tripIdIndex ? processedDetails[tripIdIndex] : currentTripId;

                // Extract driver ID
                const driverID = (detailsList.find((detail) => detail.Key === "DRIVER_ID") || {}).Value || "";
                const driverIdIndex = processedDetails.indexOf("driverId") + 1;
                row["DriverID"] = driverIdIndex > 0 && processedDetails.length > driverIdIndex ? processedDetails[driverIdIndex] : driverID;

                // Extract other known details
                const isFinalSegmentIndex = processedDetails.indexOf("isFinalSegment") + 1;
                row["IsFinalSegment"] = isFinalSegmentIndex > 0 && processedDetails.length > isFinalSegmentIndex ? processedDetails[isFinalSegmentIndex] : "";

                const segmentIndexIndex = processedDetails.indexOf("segmentIndex") + 1;
                row["segmentIndex"] = segmentIndexIndex > 0 && processedDetails.length > segmentIndexIndex ? processedDetails[segmentIndexIndex] : "";

                const correlationIdIndex = processedDetails.indexOf("correlationId") + 1;
                row["CorrelationID"] = correlationIdIndex > 0 && processedDetails.length > correlationIdIndex ? processedDetails[correlationIdIndex] : "";

                processedSDKData.push(row);
            } catch (error) {
                console.error("Error processing SDK data", error);
            }
        });

        // Sort the processed data by timestamp
        processedSDKData.sort((a, b) => new Date(a._ts) - new Date(b._ts));
        return processedSDKData;
    }


    const updateNodes = async (tripId) => {
        if (!tripId || !isValidGUID(tripId)) return;

        try {
            setLoading(true);
            setHasResult(true);
            const fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                }
            };

            // Make API calls sequentially
            const cosmosResponse = await fetch('/api/telematics/di/di_search_by_tripId', {
                ...fetchOptions,
                body: JSON.stringify({ tripId: tripId })
            });
            const cosmosData = await cosmosResponse.json();

            const insightsResponse = await fetch('/api/telematics/blt/blt_search_by_tripId', {
                ...fetchOptions,
                body: JSON.stringify({ tripId: tripId })
            });
            const insightsData = await insightsResponse.json();

            const successfulSDKResponse = await fetch('/api/telematics/sdk/sdk_trip_search', {
                ...fetchOptions,
                body: JSON.stringify({ Id: tripId, logTable: "GEICO_SDK_LOGGING_INFO" })
            });
            const successfulSDKData = await successfulSDKResponse.json();

            const failedSDKResponse = await fetch('/api/telematics/sdk/sdk_trip_search', {
                ...fetchOptions,
                body: JSON.stringify({ Id: tripId, logTable: "GEICO_SDK_LOGGING_ERROR" })
            });
            const failedSDKData = await failedSDKResponse.json();

            // Process SDK data
            const processedSuccessSDKData = successfulSDKData.length > 0 ? preprocessingSDKData(successfulSDKData) : [];
            const processedFailedSDKData = failedSDKData.length > 0 ? preprocessingSDKData(failedSDKData) : [];
            const processedSDKData = processedSuccessSDKData.concat(processedFailedSDKData);

            // Combine all data
            let data = cosmosData.concat(insightsData, processedSDKData);
            // Check if all sources are empty
            if (cosmosData.length === 0 && insightsData.length === 0 && processedSDKData.length === 0) {
                setHasResult(false);
            }

            // Set data in states
            setTripAllSegs(data);
            setTableSegsList(data);

            // Set trip start and end times
            if (cosmosData.length > 0) {
                const tripStartTimes = cosmosData.map((trip) => trip.TripStart);
                const tripEndTimes = cosmosData.map((trip) => trip.TripEnd);

                const tripStartTime = new Date(Math.min(...tripStartTimes) * 1000).toUTCString();
                const tripEndTime = new Date(Math.max(...tripEndTimes) * 1000).toUTCString();

                setTripStartTime(tripStartTime);
                setTripEndTime(tripEndTime);
            }

            // Update nodes in the flow chart
            let updatedNodes = initialNodes.map(node => {
                const filteredData = data.filter(d => d.container === node.data.pipelineComponent);
                let status = "error";
                let uniqueSegmentIDs = new Set();
                let processedsuccessfully = false;
                filteredData.forEach(d => {
                    if (d.IsFinalSegment) {
                        node.data.isFinalSegmentAvailable = 'true';
                    } else {
                        node.data.isFinalSegmentAvailable = 'false';
                    }
                    if (d.ProcessCode === 200 && d.CorrelationID && d.container != "SDK" && d.container != "SensorWriterAudit" && d.container != "TripSummaryAudit" && d.container != "TripSummaryWriterAudit") {
                        uniqueSegmentIDs.add(d.CorrelationID);
                    }
                    if (d.container == "SDK" && d.MESSAGE == "Segment upload succeeded") {
                        uniqueSegmentIDs.add(d.CorrelationID);
                    }
                });
                const processedSegmentCount = uniqueSegmentIDs.size;
                const totalUniqueSegments = filteredData.reduce((acc, item) => {
                    if (item.CorrelationID) {
                        acc.add(item.CorrelationID);
                    }
                    return acc;
                }, new Set()).size;

                const unprocessedSegmentCount = Math.abs(totalUniqueSegments - processedSegmentCount);

                if (node.data.pipelineComponent === "BLT") {
                    status = filteredData.some(item => item.Name === "EH_TripSummary_Ingest_Success_TripSummary") ? "success" : "error";
                } else {
                    if (node.data.pipelineComponent == "SDK" || node.data.pipelineComponent == "TripSegmentAudit" || node.data.pipelineComponent == "TripAggregatorAudit") {
                        status = unprocessedSegmentCount > 0 || totalUniqueSegments === 0 ? "error" : "success";
                    } else {
                        status = filteredData.some(item => item.ProcessCode === 200) ? "success" : "error";
                        processedsuccessfully = filteredData.some(item => item.ProcessCode === 200) ? 'true' : 'false';
                    }
                }

                node.data.status = status;
                node.data.processedsuccessfully = processedsuccessfully;
                node.data.totalSegmentCount = totalUniqueSegments;
                node.data.processedSegmentCount = Math.abs(processedSegmentCount);
                node.data.unprocessedSegmentCount = unprocessedSegmentCount;

                return node;
            });
            setNodes(updatedNodes);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
            setHasResult(false);
        }
    };
    const handleClick = async (trip) => {
        const tripId = trip.toUpperCase();
        setTripSearch(tripId);
        setIsValidTrip(isValidGUID(tripId));
        setTripAllSegs([]);
        setTableSegsList([]);
        updateNodes(tripId);
    };


    const tripidHandleKeyPress = async (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const value = e.target.value.trim();

            if (!value) {
                setIsValidTrip(false);
                return;
            }

            if (isValidGUID(value)) {
                setIsValidTrip(true);
                setErrorMessage("");
                setTripSearch(value.toUpperCase());
                updateNodes(value.toUpperCase());
            } else {
                setIsValidTrip(false);
            }
        }
    };

    const handleSelectBox = async (e) => {
        setTableSegsList([]);
        const component = e.target.value
        setComponent(component);

        // set tableSegsList
        if (component == "All") {
            setTableSegsList(tripAllSegs);
        }
        else {
            const filteredDataByTable = tripAllSegs.filter(trip => trip.container == auditTables[component]);
            setTableSegsList(filteredDataByTable);
        }
    };

    const handleItemClick = (item, index) => {
        setSelectedItem(index);
        handleClick(item);
    };
    const isValidGUID = (guid) => {
        const regexGUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return regexGUID.test(guid);
    };

    const handleDatePicker = (e) => {
        if (e.key == "Enter") {
            e.preventDefault;
            if (!driverSearch.trim()) {
                setErrorMessage("Driver ID cannot be empty");
                return;
            }

            if (!currStartDateStr && !currEndDateStr) {
                setErrorMessage("Start and End date can't be empty");
            } else if (currStartDateStr && !currEndDateStr) {
                setErrorMessage("End date is not selected");
            } else if (!currStartDateStr && currEndDateStr) {
                setErrorMessage("Start date is not selected");
            } else if (currStartDateStr > currEndDateStr) {
                setErrorMessage("Start date can't be after the End date");
            } else {
                event.preventDefault();
                setErrorMessage("");
                driveridHandleKeyPress()
            }
        }
    };

    return (
        <>  <div className='summary_tab' style={{ flex: 1, padding: "2px", width: '98.5%' }}>
            <label className="text">Search by Driver ID</label>
            <div style={{ display: "flex", gap: "20px", alignItems: "center", fontSize: "11pt" }}>
                <DateRangeSelector onStartUpdate={setCurrStartDateStr} onEndUpdate={setCurrEndDateStr} errorMessage={errorMessage} />
                <div className="search-box" style={{ width: "400px", marginTop: "25px" }}>
                    <div className="search-wrapper">
                        <input type="text"
                            className="search-input"
                            name="searchBox"
                            aria-label="Search"
                            autoComplete="off"
                            placeholder="Enter Driver ID then press Enter"
                            value={driverSearch}
                            onKeyDown={handleDatePicker}
                            onChange={(e) => { setDriverSearch(e.target.value) }}></input>
                        {errorMessage && <div style={{ color: 'red', marginTop: '-35px', marginBottom: "10px" }}>{errorMessage}</div>}
                    </div>
                </div>
            </div >
            <div>
                {loadingDriver ? (
                    <div className="loadingStyle">
                        Searching... for DriverId : {driverSearch}
                    </div>

                ) : hasResultDriver ? (
                    <div className="resultContainer">
                        <ul>
                            {driverUniqTrips.map((d, index) => (
                                <li key={index}
                                    onClick={() => handleItemClick(d, index)}
                                    className={`listItem ${index === selectedItem ? 'selected' : ''}`}>
                                    {d}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="noRecordStyle">
                        No record found.
                    </div>
                )}
            </div>
        </div>
            <label className="text" style={{ marginTop: "20px" }} >Search by Trip ID</label>
            <div style={{ display: "flex", gap: "20px", alignItems: "center", fontSize: "11pt" }}>
                <div className="search-box" style={{ width: "400px" }}>
                    <div className="search-wrapper">
                        <input type="text"
                            className="search-input"
                            name="searchBox"
                            aria-label="Search"
                            autoComplete="off"
                            placeholder="Enter trip ID then press Enter"
                            value={tripSearch}
                            onKeyDown={tripidHandleKeyPress}
                            onChange={(e) => { setTripSearch(e.target.value) }}></input>
                        {!isValidTrip && <div style={{ color: 'red', marginTop: '-35px' }}>Please enter a valid TripId</div>}
                    </div>
                </div>
                <ExportButton jsonData={tripAllSegs} />
                {/*<div className="form-field checkbox-group pipeline-topbar" role="radiogroup" style={{ paddingLeft: "4px" }}>
                    <div className="checkbox-wrapper">
                        <div>
                            <input id="wrap" type="checkbox"
                                className="checkbox"
                                name="wrap"
                                checked={wrap == true}
                                onChange={(e) => { setWrap(!wrap) }}
                                style={{ display: "none" }}
                                value={wrap} />
                            <label htmlFor="wrap" className="checkbox">Wrap logs</label>
                        </div>
                    </div>
                </div>*/}
            </div>
            <div className='summary_row' style={{ width: "90%" }}>
                {loading ? (
                    <div className='loadingStyle'>Searching...for TripID:  {tripSearch}</div>
                ) : hasResult ? (
                    <div style={{ marginTop: "10px" }}>
                        <h4 style={{ padding: "4px" }}>
                            Trip ID: {tripAllSegs[0]?.TripID || 'N/A'}
                        </h4>
                        <h4 style={{ padding: "4px" }}>
                            Driver ID: {tripAllSegs[0]?.DriverID || 'N/A'}
                        </h4>
                        <div style={{ display: "flex", flexDirection: "row" }}>
                            <div className='summary_tab' style={{ flex: 1 }}>
                                <h5>{tripAllSegs[0]?.RatingRegion || 'N/A'}</h5>
                                <h5>Rating Region in DI</h5>
                            </div>
                            <div className='summary_tab' style={{ flex: 1 }}>
                                <h5>{tripStartTime || 'N/A'}</h5>
                                <h5>Trip Start Time in DI</h5>
                            </div>
                            <div id="total-drifted-columns" className='summary_tab' style={{ flex: 1 }}>
                                <h5>{tripEndTime || 'N/A'}</h5>
                                <h5>Trip End Time in DI </h5>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='loadingStyle'>No record found</div>
                )}
            </div>
            <div style={{ width: "100%", height: "400px" }}>
                <ReactFlow
                    nodeTypes={nodeTypes}
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}>
                </ReactFlow>
            </div>
            <div style={{ width: "100%" }}>
                <label className="text"> Select Audit Table </label>
                <div className="select-box panel-bar-selector">
                    <select value={component} onChange={handleSelectBox}>
                        {
                            components.map((item, index) => {
                                return <option key={index}>{item}</option>
                            })
                        }
                    </select>
                </div>
                <div style={{ maxHeight: "250px", overflowY: "scroll" }}>
                    <ul id="log-results-accordion" className="accordion dense">
                        {tableSegsList.map((d, index) => (
                            <li key={`${d.container}-${d.id}-${index}`}>
                                <div tabIndex="0" className="accordion-headline" style={{ minHeight: "auto" }}>
                                    <div className="accordion-headline-content-wrapper">
                                        <div className="accordion-left-content-wrapper">
                                            <div
                                                className="heading"
                                                style={{ paddingTop: "1rem", paddingBottom: "1rem", whiteSpace: "pre" }}
                                            >
                                                {formatAuditRecord(d)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="accordion-content-container">
                                    <div className="accordion-content" style={{ paddingBottom: "2rem" }}>
                                        <textarea
                                            style={{ fontSize: "inherit", marginBottom: 0 }}
                                            value={JSON.stringify(d, null, 2)}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    )
};