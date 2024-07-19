import React, { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { FaCheckCircle, FaExclamationTriangle, FaCog } from 'react-icons/fa';

function TripTrackerNode({ data }) {
    const [statusIcon, setStatusIcon] = useState(<FaCog />);

    return (
        <>
            <Handle type="target" position={Position.Left} className="" />
            <div className={`pipeline-component ${data.status}`}>
                {
                    data.label == "BLT" ? (
                        <div className="component-title">
                            <div style={{ fontSize: "14pt", textAlign: "center" }}>{data.label}</div>
                            <div className="metrics-results" style={{ border: '1px solid grey', padding: '10px', borderRadius: '4px' }}>
                                <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Status: {data.status == "initial" ? "" : data.status}</div>
                            </div>
                        </div>
                    ) : (data.label == "Trip Summary" || data.label == "Trip Summary Writer" || data.label == "Sensor Writer") ? (
                        <div className="component-title">
                            <div style={{ fontSize: "14pt", textAlign: "center" }}>{data.label}</div>
                            <div className="metrics-results" style={{ border: '1px solid grey', padding: '10px', borderRadius: '4px' }}>
                                <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Is Final Segment Available: {data.isFinalSegmentAvailable}</div>
                                <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Processed Successfully: {data.processedsuccessfully}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="component-title">
                            <div style={{ fontSize: "14pt", textAlign: "center" }}>{data.label}</div>
                            <div className="metrics-results" style={{ border: '1px solid grey', padding: '10px', borderRadius: '4px' }}>
                                <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Is Final Segment Available: {data.isFinalSegmentAvailable}</div>
                                <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Total Segment Count: {data.totalSegmentCount}</div>
                                <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Processed Segment Count: {data.processedSegmentCount}</div>
                                <div style={{ fontSize: "11pt", marginBottom: '4px' }}>Unprocessed Segment Count: {data.unprocessedSegmentCount}</div>
                            </div>
                        </div>
                    )
                }
                <div className="component-icon">
                    {statusIcon}
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="" />
        </>
    );
}

export default TripTrackerNode;