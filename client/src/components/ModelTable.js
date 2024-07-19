import React, { useState, useEffect, memo } from 'react';
import '../gdk/css/geico-design-kit.css';
import DateRangeSelector from './panelbar/DateRangeSelector';
import { Link } from 'react-router-dom';

function ModelTable() {
    const [models, setModels] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterOwner, setFilterOwner] = useState('');
    //const [startDate, setStartDate] = useState(new Date(2018, 1, 1));  Dates placeholder
    //const [endDate, setEndDate] = useState(new Date());
    const [errorMessage, setErrorMessage] = useState("");
    const [filteredModels, setFilteredModels] = useState([]);

    const fetchModels = async () => {
        try {
            const response = await fetch('/api/models', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                }
            });
            const data = await response.json();
            setModels(data.deployed_models);
            setFilteredModels(data.deployed_models);
        } catch (error) {
        }
    };

    useEffect(() => {
        fetchModels();                          // fetch models on initial rendering
    }, []);

    useEffect(() => {
        filterModels();                           // fetch models based on filters
    }, [searchValue, filterStatus, filterOwner]
    );

    const handleChange = (e) => {
        setSearchValue(e.target.value.toLowerCase());
        filterModels();      // update filtered data on search value        
    };

    const handleFilterStatusChange = (e) => {
        setFilterStatus(e.target.value);
        filterModels();      // update filtered data on Model Status change       
    };

    const handleFilterOwnerChange = (e) => {
        setFilterOwner(e.target.value);
        filterModels();      // update filtered data on Model Owner change        
    };


    const filterModels = () => {
        let filtered = models;

        if (searchValue) {
            filtered = filtered.filter(item => item.display_name.toLowerCase().includes(searchValue));
        }

        if (filterStatus && filterStatus !== 'all') {
            filtered = filtered.filter(item =>
                (filterStatus === 'active' && item.monitoring_enabled) ||
                (filterStatus === 'inactive' && !item.monitoring_enabled)
            );
        }

        if (filterOwner && filterOwner !== 'all') {
            filtered = filtered.filter(item =>
                item.created_by && item.created_by.toLowerCase().includes(filterOwner.toLowerCase())
            );
        }

        // date range logic - Placeholder
        /*if (startDate && endDate) {
            filtered = filtered.filter(item =>
                (item.created_at >= startDate && item.created_at <= endDate)
            );
        }*/

        setFilteredModels(filtered);
    };

    // Populate dropdown options for the owner
    const ownerOptions = Array.from(new Set(models.map(item => item.created_by)))
        .filter(owner => owner)
        .map(owner => (
            <option key={owner} value={owner}>{owner}</option>
        ));


    const handleResetFilters = () => {
        setSearchValue('');
        setFilterStatus('');
        setFilterOwner('');
        //setStartDate('');   // placeholder for resetting the dates
        //setEndDate('');     // placeholder for resetting the dates
    };

    return (
        <div className="data-table">
            <div style={{ display: 'flex', gap: '5px', marginTop: '10px', }}>

                {/* Search box */}
                <input type="text" placeholder='Search by Model Name...'
                    className="select-box panel-bar-selector"
                    style={{ padding: '8px', marginLeft: "10px", cursor: 'text', fontStyle: "italic", marginBottom: "10px", width: "30%", border:"solid 1px" }}
                    value={searchValue}
                    onChange={handleChange} />

                {/* Filter status dropdown */}
                <select className="select-box panel-bar-selector" style={{ color: 'white', marginLeft: "5px", marginRight: "5px", padding: '5px', fontWeight: "bold", background: '#2b2b2f', borderRadius: "10px", border: "0" }}
                    value={filterStatus} onChange={handleFilterStatusChange}>
                    <option value=""> Model Status </option>
                    <option value="all">All </option>
                    <option value={'active'}>  Active  </option>
                    <option value={'inactive'}>  Inactive  </option>
                </select>

                {/* Filter owner dropdown */}
                <select className="select-box" style={{color: 'white',marginRight: "5px", padding: '5px', fontWeight: "bold", background: '#2b2b2f', borderRadius: "10px", border: "0" }}
                    value={filterOwner} onChange={handleFilterOwnerChange}>
                    <option value="">Model Owner</option>
                    <option value="all">All </option>
                    {ownerOptions}
                </select>

                {/* Button to reset filters */}
                <button className="btn btn--primary btn--full-mobile btn--pull-left"
                    style={{ marginLeft: "5px", padding: "10px", fontSize: "12px", display: "flex", alignItems: "center" }}
                    onClick={handleResetFilters} >Reset Filters</button>

                {/*Start, End Date Selector - Placeholder
                <div style={{ display: "flex", }}>
                <DateRangeSelector onStartUpdate={setStartDate} onEndUpdate={setEndDate} errorMessage={errorMessage}/>
                {console.log("stat dt: ", startDate)}
                </div>
                */}

            </div>

            <table className="table" style={{ width: '100%', tableLayout: "fixed", }} >
                <thead>
                    <tr>
                        <th style={{ width: "10%" }}>Name</th>
                        <th style={{ width: "20%" }}>Drift Monitoring Enabled</th>
                        <th style={{ width: "18%" }}>Avg Predictions/Day</th>
                        <th style={{ width: "17%" }}>Total Prediction (1d) </th>
                        <th style={{ width: "13%" }}>Failed Requests</th>
                        <th style={{ width: "12%" }}>Model Owner</th>
                        <th style={{ width: "10%" }}>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredModels.map((model) => (
                        <ModelRow key={model.id} model={model} />

                    ))}
                </tbody>
            </table>

        </div>
    );
}

function formatDate(isoTimestamp) {
    const date = new Date(isoTimestamp);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function ModelRow({ model }) {
    const [stats, setStats] = useState(null);
    const fetchStats = async () => {
        const url = `/api/metrics/requests_stats?model=${model.model_name}&timespan=1d`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('brille-token')}`
            }
        });
        const data = await response.json();
        setStats(data.requests[0]);

    }
    useEffect(() => {
        fetchStats();

    }, [model.id]);
    return (
        <tr key={model.id}>
            <td>{model.monitoring_enabled ? (
                <Link to={`/details/${model.model_name}`}>{model.display_name}</Link>
            ) : (model.display_name)}</td>
            <td style={{
                color: model.monitoring_enabled ? "green" : "red"
            }}>{model.monitoring_enabled ? "\u2714\ufe0f" : "\u274C"}</td>

            <td>{stats ? stats.avg_request : ""}</td>

            <td>{stats ? stats.request_count : ""}</td>

            <td>{stats ? stats.failed_request : ""}</td>
            <td>{model ? model.created_by : ""}</td>
            <td>{model ? formatDate(model.created_at) : ""}</td>

        </tr>
    );
}
export default ModelTable;