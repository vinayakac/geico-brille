import React, { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { FaCheckCircle, FaExclamationTriangle, FaCog } from 'react-icons/fa';
function PipelineNode({ data }) {
    const [apiData, setApiData] = useState({});
    const [apiBLTData, setApiBLTData] = useState({});
    const [apiSplunkData, setApiSplunkData] = useState({});
    const [statusIcon, setStatusIcon] = useState(<FaCog />);
    const [isLoading, setIsLoading] = useState(false);
    const { startTimestamp, endTimestamp, ratingRegion, phoneModel, deviceOS, pipelineComponent, metricsType, osCategory } = data;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            let response;
            if (metricsType === "dataPipeline") {
                response = await fetch(`/api/telematics/metrics/di_metrics?startTimestamp=${startTimestamp || ""}&endTimestamp=${endTimestamp || ""}&ratingRegion=${ratingRegion}&phoneModel=${phoneModel}&deviceOS=${deviceOS}&pipelineComponent=${pipelineComponent}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
                const data = await response.json();
                setApiData(data);
            } else if (metricsType === "BLT") {
                response = await fetch(`/api/telematics/metrics/blt_metrics?startTimestamp=${startTimestamp || ""}&endTimestamp=${endTimestamp || ""}&deviceOS=${deviceOS}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
                const data = await response.json();
                setApiBLTData(data);
            } else if (metricsType === "splunk") {
                response = await fetch(`/api/telematics/metrics/sdk_metrics?startTimestamp=${startTimestamp || ""}&endTimestamp=${endTimestamp || ""}&phoneModel=${phoneModel}&deviceOS=${deviceOS}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
                const data = await response.json();
                setApiSplunkData(data);
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [startTimestamp, endTimestamp, ratingRegion, pipelineComponent, phoneModel, deviceOS, metricsType, osCategory]);

    return (
        <>
            <Handle type="target" position={Position.Left} className="" />
            {metricsType == "dataPipeline" &&
                <div className={`pipeline-component ${data.status}`}>
                    <div className="component-title">
                        <div style={{ fontSize: "14pt", textAlign: "center" }}>
                            {data.label}
                            {isLoading ? <div className='spinner' style={{ marginLeft: "15px" }}></div> : null}
                        </div>
                        <div className="metrics-results" style={{ border: '1px solid grey', padding: '10px', borderRadius: '4px' }}>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Trip Count: {apiData.trip_count}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Driver Count: {apiData.driver_count}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Segments: {apiData.total_segments}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Successful Trips : {apiData.successful_trips}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Failed Segments : {apiData.failed_segments}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Segment Size: {(apiData.total_segment_size / 1048576).toFixed(2)} MB</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Trip Elapsed Time: {(apiData.trip_elapsed_time_seconds / 3600).toFixed(0)} hrs</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Missing Final Seg Count: {apiData.is_final_seg_missing}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Missing Seg Count: {apiData.missing_seg_count}</div>
                            <div style={{ fontSize: "11pt" }}>Total Process Time: {(apiData.total_process_time / 3600).toFixed(0)} hrs</div>
                        </div>
                    </div>

                    <div className="component-icon">
                        {statusIcon}
                    </div>
                </div>
            }
            {metricsType == "BLT" &&
                <div className={`pipeline-component ${data.status}`}>
                    <div className="component-title">
                        <div style={{ fontSize: "14pt", textAlign: "center" }}>
                            {data.label}
                            {isLoading ? <div className='spinner' style={{ marginLeft: "15px" }}></div> : null}
                        </div>
                        <div className="metrics-results" style={{ border: '1px solid grey', padding: '10px', borderRadius: '4px' }}>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Trip Count: {apiBLTData.trip_count ? apiBLTData.trip_count : 0} </div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Successful processes: {apiBLTData.successful_process_count ? apiBLTData.successful_process_count : 0}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Failed Processes: {apiBLTData.failed_process_count ? apiBLTData.failed_process_count : 0}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Driver Count: {apiBLTData.driver_count ? apiBLTData.driver_count : 0}</div>
                        </div>
                    </div>

                    <div className="component-icon">
                        {statusIcon}
                    </div>
                </div>

            }
            {metricsType == "splunk" &&
                <div className={`pipeline-component ${data.status}`}>
                    <div className="component-title">
                        <div style={{ fontSize: "14pt", textAlign: "center" }}>
                            {data.label}
                            {isLoading ? <div className='spinner' style={{ marginLeft: "15px" }}></div> : null}
                        </div>
                        <div className="metrics-results" style={{ border: '1px solid grey', padding: '10px', borderRadius: '4px' }}>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Trip Count: {apiSplunkData.trip_count}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Driver Count: {apiSplunkData.driver_count}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Segments: {apiSplunkData.segment_count}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Upload Succeeded: {apiSplunkData.Segment_upload_succeeded}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Upload Failed: {apiSplunkData.Segment_upload_failed}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Upload Enqueued: {apiSplunkData.Segment_enqueued}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Upload Began: {apiSplunkData.Segment_upload_began}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Segment Output: {apiSplunkData.Segment_output}</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Segment Size: {(apiSplunkData.segment_size / 1048576).toFixed(2)} MB</div>
                            <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Operation Time: {(apiSplunkData.operation_time / 3600).toFixed(0)} hrs</div>
                        </div>
                    </div>

                    <div className="component-icon">
                        {statusIcon}
                    </div>
                </div>
            }
            <Handle type="source" position={Position.Right} className="" />

        </>
    );
}

export default PipelineNode;