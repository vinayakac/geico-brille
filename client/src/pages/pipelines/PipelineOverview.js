import { useEffect, useState, useCallback, useMemo } from 'react';
import PipelineNodes from '../../components/pipeline/PipelineNode';
import PipelineSummaryCard from '../../components/pipeline/PipelineSummaryCard';
import DateRangeSelector from '../../components/panelbar/DateRangeSelector';
import '../../gdk/css/geico-design-kit.css';
import * as d3 from 'd3';
import ReactFlow, {
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
} from 'reactflow';

import 'reactflow/dist/style.css';
import { PipelineSidebar } from '../../components/pipeline/PipelineSidebar';
import { PipelineLogSearch } from '../../components/pipeline/PipelineLogSearch';

export default function PipelineOverview() {

    const [view, setView] = useState("summary");
    const [region, setRegion] = useState("");
    const [regions, setRegions] = useState([]);
    const [deviceType, setDeviceType] = useState("");
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [OS, setOS] = useState("");
    const [devicesOS, setDevicesOS] = useState([]);
    const [currStartDateStr, setCurrStartDateStr] = useState("");
    const [currEndDateStr, setCurrEndDateStr] = useState("");
    const [pipelineComponent, setPipelineComponent] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const fetchData = async (fieldType) => {
        try {
            const response = await fetch(`/api/telematics/metrics/fields?field=${fieldType}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (fieldType == "rating_region") {
                setRegions(data["rating_region"]);
            }
            else if (fieldType == "phone_model") {
                setDeviceTypes(data["phone_model"])
            }
            else if (fieldType == "device_os") {
                setDevicesOS(data["device_os"]);
            }

        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
    };

    const updateNodes = () => {
        const updatedNodes = initialNodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                ratingRegion: region,
                startTimestamp: currStartDateStr,
                endTimestamp: currEndDateStr,
                phonemodel: deviceType,
                deviceOS: OS
            }
        }));
        setNodes(updatedNodes);
    };

    useEffect(() => {
        fetchData("phone_model");
        fetchData("rating_region");
        fetchData("device_os");
        updateNodes();
    }, [deviceType, region, OS, currStartDateStr, currEndDateStr]);

    const initialNodes = [
        { type: 'pipeline', id: '1', position: { x: 0, y: 98 }, data: { metricsType: "splunk", label: 'SDK', status: "success", startTimestamp: currStartDateStr, endTimestamp: currEndDateStr, phoneModel: deviceType, deviceOS: OS } },
        { type: 'pipeline', id: '2', position: { x: 280, y: 100 }, data: { metricsType: "dataPipeline", label: 'Trip Segment', status: "success", startTimestamp: currStartDateStr, endTimestamp: currEndDateStr, ratingRegion: region, phoneModel: deviceType, deviceOS: OS, pipelineComponent: "TripSegmentAudit" } },
        { type: 'pipeline', id: '3', position: { x: 545, y: 5 }, data: { metricsType: "dataPipeline", label: 'Trip Aggregator', status: "success", startTimestamp: currStartDateStr, endTimestamp: currEndDateStr, ratingRegion: region, phoneModel: deviceType, deviceOS: OS, pipelineComponent: "TripAggregatorAudit" } },
        { type: 'pipeline', id: '4', position: { x: 545, y: 300 }, data: { metricsType: "dataPipeline", label: 'Sensor Writer', status: "success", startTimestamp: currStartDateStr, endTimestamp: currEndDateStr, ratingRegion: region, phoneModel: deviceType, deviceOS: OS, pipelineComponent: "SensorWriterAudit" } },
        { type: 'pipeline', id: '5', position: { x: 820, y: 100 }, data: { metricsType: "dataPipeline", label: 'Trip Summary', status: "success", startTimestamp: currStartDateStr, endTimestamp: currEndDateStr, ratingRegion: region, phoneModel: deviceType, deviceOS: OS, pipelineComponent: "TripSummaryAudit" } },
        { type: 'pipeline', id: '6', position: { x: 1090, y: 100 }, data: { metricsType: "dataPipeline", label: 'Trip Summary Writer', status: "success", startTimestamp: currStartDateStr, endTimestamp: currEndDateStr, ratingRegion: region, phoneModel: deviceType, deviceOS: OS, pipelineComponent: "TripSummaryWriterAudit" } },
        { type: 'pipeline', id: '7', position: { x: 1355, y: 171 }, data: { metricsType: "BLT", label: 'BLT', status: "success", startTimestamp: currStartDateStr, endTimestamp: currEndDateStr, osCategory: OS } }
    ]
    const initialEdges = [
        { id: 'e1-3', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
        { id: 'e3-4', source: '2', target: '4', animated: true },
        { id: 'e4-5', source: '4', target: '5', animated: true },
        { id: 'e5-5', source: '3', target: '5', animated: true },
        { id: 'e6-6', source: '5', target: '6', animated: true },
        { id: 'e7-7', source: '6', target: '7', animated: true },
        { id: 'e8-7', source: '7', target: '8', animated: true },
    ]
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const nodeTypes = useMemo(() => ({ pipeline: PipelineNodes }), []);
    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
    const menuItems = [
        {
            title: 'Trips Summary',
            itemId: 'summary'
        },
        {
            title: 'Trip Tracker',
            itemId: 'tracker'
        }
    ];

    return (
        <>
            {(view === 'summary' || view === 'tracker') && (
                <aside className="side-nav">
                    <PipelineSidebar title={"Telematics"} items={menuItems} active_view={view} updateView={setView} />
                </aside>
            )}
            {view == 'summary' &&
                <main role={"main"} id="wrapper" className='bg-color--cloudy'
                    style={{ paddingTop: "3.2em", marginLeft: "240px", marginTop: "8px" }}>
                    <div className="main-page" style={{ width: "95%", height: "100%" }} >
                        <PipelineSummaryCard startTimestamp={currStartDateStr} endTimestamp={currEndDateStr} ratingRegion={region} phoneModel={deviceType} pipelineComponent={pipelineComponent} deviceOS={OS} />
                        <div style={{ display: "flex", gap: "20px", alignItems: "center", fontSize: "11pt" }}>
                            <DateRangeSelector onStartUpdate={setCurrStartDateStr} onEndUpdate={setCurrEndDateStr} errorMessage={errorMessage} />
                            <div className="select-box panel-bar-selector" style={{ marginBottom: "10px", marginLeft: "10px", marginRight: "10px" }}>
                                <select value={pipelineComponent} onChange={(e) => { setPipelineComponent(e.target.value); }}>
                                    <option value="">Pipeline[DI]</option>
                                    <option value="TripSegmentAudit">TripSegment</option>
                                    <option value="TripAggregatorAudit">TripAggregator</option>
                                    <option value="SensorWriterAudit">SensorWriter</option>
                                    <option value="TripSummaryAudit">TripSummary</option>
                                    <option value="TripSummaryWriterAudit">TripSummaryWriter</option>
                                </select>
                            </div>

                            <div className="select-box panel-bar-selector" style={{ marginRight: "10px", marginBottom: "10px" }}>
                                <select value={region} onChange={(e) => { setRegion(e.target.value); }}>
                                    <option value="">Select Region</option>
                                    {
                                        regions.map((regionItem, index) => {
                                            return <option key={index} value={regionItem}>{regionItem}</option>
                                        })
                                    }
                                </select>
                            </div>

                            <div className="select-box panel-bar-selector" style={{ marginRight: "10px", marginBottom: "10px" }}>
                                <select value={deviceType} onChange={(e) => { setDeviceType(e.target.value); }}>
                                    <option value="">Select Device Type</option>
                                    {
                                        deviceTypes.map((deviceItem, index) => {
                                            return <option key={index} value={deviceItem}>{deviceItem}</option>
                                        })
                                    }
                                </select>
                            </div>

                            <div className="select-box panel-bar-selector" style={{ marginBottom: "10px" }}>
                                <select value={OS} onChange={(e) => { setOS(e.target.value); }}>
                                    <option value="">Select OS</option>
                                    {
                                        devicesOS.map((deviceOS, index) => {
                                            return <option key={index} value={deviceOS}>{deviceOS}</option>
                                        })
                                    }
                                </select>
                            </div>

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
                    </div>
                </main>
            }
            {view == 'tracker' &&
                <main role={"main"} id="wrapper" className='bg-color--cloudy'
                    style={{ paddingTop: "3.2em", marginLeft: "240px", marginTop: "8px" }}>
                    <div className="main-page" style={{ width: "95%", height: "100%" }} >
                        <PipelineLogSearch />
                    </div>
                </main>
            }
        </>
    );
}