import React, { useEffect, useState } from 'react';
import Tooltip from '../Tooltip.js';
import '../../gdk/css/geico-design-kit.css';
import './pipeline.css';
import LineChart from '../widgets/LineChart.js';
import BarChart from '../widgets/BarChart';

export default function PipelineSummaryCard({ startTimestamp, endTimestamp, ratingRegion, phoneModel, pipelineComponent, deviceOS }) {

    const [reportData, setReportData] = useState();
    const [regionData, setRegionData] = useState({ xValues: [], yValues: [] });
    const [apiData, setApiData] = useState({});
    const [apiSplunkData, setApiSplunkData] = useState({});
    const [minDate, setMinDate] = useState(null);
    const [maxDate, setMaxDate] = useState(null);
    const [isDILoading, setIsDILoading] = useState(false);
    const [isSDKLoading, setIsSDKLoading] = useState(false);

    function stringRemover(str, substring) {
        return str.replace(substring, "");
    }

    function calculateMinMaxDate() {
        const allDates = [
            new Date(apiData.minDate),
            new Date(apiSplunkData.min_date),
            new Date(apiData.max_date),
            new Date(apiSplunkData.max_date)
        ].filter((timestamp) => !isNaN(timestamp));

        if (allDates.length > 0) {
            const minTimestamp = Math.min(...allDates);
            const maxTimestamp = Math.max(...allDates);

            const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
            setMinDate(new Date(minTimestamp).toLocaleDateString('en-US', options));
            setMaxDate(new Date(maxTimestamp).toLocaleDateString('en-US', options));
        }
    }

    const fetchPipelineData = async () => {
        const queryParams = new URLSearchParams({
            startTimestamp: startTimestamp || "",
            endTimestamp: endTimestamp || "",
            ratingRegion: ratingRegion || "",
            phoneModel: phoneModel || "",
            deviceOS: deviceOS || "",
            pipelineComponent: pipelineComponent || ""
        }).toString();
        setIsDILoading(true);
        try {

            const url = `/api/telematics/metrics/di_metrics?${queryParams}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('brille-token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            setApiData(data);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
        finally {
            setIsDILoading(false);
        }
    };

    const fetchSplunkData = async () => {
        setIsSDKLoading(true);
        try {
            const response = await fetch(`/api/telematics/metrics/sdk_metrics?startTimestamp=${startTimestamp ? startTimestamp : ""}&endTimestamp=${endTimestamp ? endTimestamp : ""}&phoneModel=${phoneModel}&deviceOS=${deviceOS}`,
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
            setApiSplunkData(data);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsSDKLoading(false);
        }
    };

    const fetchReportData = async () => {
        try {
            const response = await fetch(`/api/telematics/metrics/pipeline_report?startTimestamp=${startTimestamp ? startTimestamp : ""}&endTimestamp=${endTimestamp ? endTimestamp : ""}&phoneModel=${phoneModel}&deviceOS=${deviceOS}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            const groupedData = data.reduce((acc, item) => {
                if (!acc[item.date]) {
                    acc[item.date] = {
                        totalSegmentSize: 0,
                        totalProcessTime: 0,
                        totalTrips: 0,
                        totalErrorCounts: 0,
                        totalSuccessCounts: 0,
                        count: 0
                    };
                }
                acc[item.date].totalSegmentSize += Number(item.total_segment_size);
                acc[item.date].totalProcessTime += Number(item.total_process_time);
                acc[item.date].totalTrips += Number(item.trip_count);
                acc[item.date].totalErrorCounts += Number(item.total_error_counts);
                acc[item.date].totalSuccessCounts += Number(item.total_success_count);
                acc[item.date].count++;
                return acc;
            }, {});

            const calculatedData = Object.keys(groupedData)
                .map(date => {
                    const group = groupedData[date];
                    return {
                        date: date,
                        throughput: group.totalSegmentSize / group.totalProcessTime,
                        latency: group.totalProcessTime / group.totalTrips,
                        error: group.totalErrorCounts / group.totalSuccessCounts
                    };
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            setReportData(calculatedData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
    };


    const fetchRegionData = async () => {
        try {
            const response = await fetch(`/api/telematics/metrics/di_region?startTimestamp=${startTimestamp ? startTimestamp : ""}&endTimestamp=${endTimestamp ? endTimestamp : ""}&ratingRegion=${ratingRegion}&phoneModel=${phoneModel}&deviceOS=${deviceOS}&pipelineComponent=${pipelineComponent}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            let xValues = [];
            let yValues = [];

            if (data && typeof data === 'object' && !Array.isArray(data)) {
                for (const [key, value] of Object.entries(data["topCounts"])) {
                    xValues.push(key);
                    yValues.push(value);
                }
            }
            setRegionData({ xValues, yValues });
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, [startTimestamp, endTimestamp, phoneModel, deviceOS]);

    useEffect(() => {
        fetchPipelineData();
    }, [startTimestamp, endTimestamp, ratingRegion, pipelineComponent, phoneModel, deviceOS]);

    useEffect(() => {
        fetchRegionData();
    }, [startTimestamp, endTimestamp, ratingRegion, pipelineComponent, phoneModel, deviceOS]);

    useEffect(() => {
        fetchSplunkData();
    }, [startTimestamp, endTimestamp, phoneModel, deviceOS]);

    useEffect(() => {
        calculateMinMaxDate();
    }, []);

    return (
        <>   <div style={{ display: "flex", justifyContent: 'flex-end' }}>
            <div style={{
                justifyContent: 'flex-end',
                border: '1px solid grey',
                borderRadius: '5px',
                padding: '5px',
                fontWeight: 'bold',
                marginRight: '5px',
                marginBottom: '5px'
            }}>

                Earliest: {apiData.min_date ? apiData.min_date.substring(0, 10) : <div className='spinner' style={{ marginLeft: "15px" }}></div>}

            </div>

            <div style={{
                display: 'inline-flex',
                justifyContent: 'flex-end',
                border: '1px solid grey',
                borderRadius: '5px',
                padding: '5px',
                fontWeight: 'bold',
                marginBottom: '5px'
            }}>

                Latest: {apiData.max_date ? apiData.max_date.substring(0, 10) : <div className='spinner' style={{ marginLeft: "15px" }}></div>}

            </div>
        </div>
            <div className='cards-wrapper'>
                <div className="billing-cards-wrapper">
                    <div className="billing-card" >
                        <div style={{ fontSize: "13pt", fontWeight: "bold" }}>Storage Capacity <Tooltip text="Total data size in GB" />
                            {isDILoading || isSDKLoading ? <div className='spinner' style={{ marginLeft: "15px" }}></div> : ""}
                        </div>
                        <div className="billing-card-content">
                            <div>
                                <div className="description-text font--bold font--bold">SDK</div>
                                <span className="description-text font--bold">{apiSplunkData.segment_size ? (apiSplunkData.segment_size / 1048576).toFixed(2) + "MB" : 0}</span>
                            </div>
                            <span className="stroke-separator stroke-separator--vertical"></span>
                            <div>
                                <div className="description-text font--bold font--bold">{pipelineComponent ? stringRemover(pipelineComponent, "Audit") : "DI"}</div>
                                <span className="description-text font--bold">{apiData.total_segment_size ? (apiData.total_segment_size / 1048576).toFixed(2) + "MB" : 0} </span>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="billing-cards-wrapper">
                    <div className="billing-card">
                        <div style={{ fontSize: "13pt", fontWeight: "bold" }}>Throughput <Tooltip text="Data size in bytes by process time in sec" />
                            {isDILoading || isSDKLoading ? <div className='spinner' style={{ marginLeft: "15px" }}></div> : ""}
                        </div>
                        <div className="billing-card-content">
                            <div>
                                <div className="description-text font--bold font--bold">SDK</div>
                                <span className="description-text font--bold">{apiSplunkData.segment_size ? (apiSplunkData.segment_size / apiSplunkData.operation_time).toFixed(2) + "b/sec" : 0}</span>
                            </div>
                            <span className="stroke-separator stroke-separator--vertical"></span>
                            <div>
                                <div className="description-text font--bold font--bold">{pipelineComponent ? stringRemover(pipelineComponent, "Audit") : "DI"}</div>
                                <span className="description-text font--bold">{apiData.total_segment_size ? (apiData.total_segment_size / apiData.total_process_time).toFixed(2) + "b/sec" : 0}</span>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="billing-cards-wrapper">
                    <div className="billing-card">
                        <div style={{ fontSize: "13pt", fontWeight: "bold" }}>Error Rate  <Tooltip text="Error count by successful count" />
                            {isDILoading || isSDKLoading ? <div className='spinner' style={{ marginLeft: "15px" }}></div> : ""}
                        </div>
                        <div className="billing-card-content">
                            <div>
                                <div className="description-text font--bold font--bold">SDK</div>
                                <span className="description-text font--bold"> {apiSplunkData.Segment_upload_failed ? (apiSplunkData.Segment_upload_failed / apiSplunkData.Segment_upload_succeeded).toFixed(3) + "%" : 0} </span>
                            </div>
                            <span className="stroke-separator stroke-separator--vertical"></span>
                            <div>
                                <div className="description-text font--bold font--bold">{pipelineComponent ? stringRemover(pipelineComponent, "Audit") : "DI"}</div>
                                <span className="description-text font--bold">{apiData.failed_segments ? (apiData.failed_segments / apiData.successful_segments).toFixed(3) + "%" : 0} </span>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="billing-cards-wrapper">
                    <div className="billing-card">
                        <div style={{ fontSize: "13pt", fontWeight: "bold" }}>Latency <Tooltip text="Process time in secs for a single trip" />
                            {isDILoading || isSDKLoading ? <div className='spinner' style={{ marginLeft: "15px" }}></div> : ""}
                        </div>
                        <div className="billing-card-content">
                            <div>
                                <div className="description-text font--bold font--bold">SDK</div>
                                <span className="description-text font--bold">{apiSplunkData.operation_time ? (apiSplunkData.operation_time / apiSplunkData.trip_count).toFixed(2) + "sec/trip" : 0} </span>
                            </div>
                            <span className="stroke-separator stroke-separator--vertical"></span>
                            <div>
                                <div className="description-text font--bold font--bold">{pipelineComponent ? stringRemover(pipelineComponent, "Audit") : "DI"}</div>
                                <span className="description-text font--bold">{apiData.total_process_time ? (apiData.total_process_time / apiData.trip_count).toFixed(2) + "sec/trip" : 0}</span>
                            </div>

                        </div>
                    </div>
                </div>
            </div>


            <div className='summary_tab' style={{ flex: 1, padding: "2px", width: '98.5%' }}>
                {isDILoading ? <div className='spinner' style={{ marginLeft: "15px" }}></div> : ""}
                <BarChart
                    x={regionData.xValues}
                    y={{ 'counts': regionData.yValues }}
                    title={`Rating Region for ${pipelineComponent ? stringRemover(pipelineComponent) : "Overall DI"}`}
                    margin={{ t: 30, b: 8, pad: 4 }}
                    plotHeight={100}
                    showlegend={false}
                    y_label="Trip Counts"
                />

            </div>

            <div style={{ display: "flex", flexDirection: "row", marginBottom: "20px" }}>
                <div className='summary_tab' style={{ flex: 1, padding: "2px" }}>
                    {isSDKLoading ? <div className='spinner' style={{ marginLeft: "15px" }}></div> : ""}
                    <LineChart x={reportData?.map(d => d.date) || []}
                        y={{ valueKey: reportData?.map(d => d.throughput) || [] }}
                        title="Throughput bytes/sec         SDK Data"
                        margin={{ t: 30, b: 8, pad: 4 }}
                        plotHeight={100}
                        showlegend={false} />
                </div>
                <div className='summary_tab' style={{ flex: 1, padding: "2px" }}>
                    {isSDKLoading ? <div className='spinner' style={{ marginLeft: "15px" }}></div> : ""}
                    <LineChart x={reportData?.map(d => d.date) || []}
                        y={{ valueKey: reportData?.map(d => d.latency) || [] }}
                        title="Latency secs/trip          SDK Data"
                        margin={{ t: 30, b: 8, pad: 4 }}
                        plotHeight={100}
                        showlegend={false}
                    />
                </div>

            </div>
        </>
    );
}