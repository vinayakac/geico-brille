import { useEffect, useState } from 'react';
import '../../gdk/css/geico-design-kit.css';
import { useTable, useSortBy } from 'react-table';
import NetworkGraph from '../../components/widgets/NetworkGraph';
import SideBarPanel from '../../components/panels/SideBarPanel';

export default function Features() {
    const [data, setData] = useState([]);
    const [initialData, setInitialData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [field, setField] = useState();
    const [modelToFeatures, setModelToFeatures] = useState({});
    const [featureToModels, setFeatureToModels] = useState({});
    const [selectedModels, setSelectedModels] = useState([]);
    const [graphData, setGraphData] = useState({
        nodes: [
        ],
        links: [
        ]
    });
    let switchButton;
    const [showGraphView, setShowGraphView] = useState(false);

    const initialState = {
        hiddenColumns: ["etag", "partitionKey", "rowKey", "timestamp", "IsTimeWindow", "CodeLookUp", "IsCalculated", "Replacement"
        ]
    };

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow
    } = useTable({
        columns,
        data,
        initialState,
    },
        useSortBy
    )

    const [view, setView] = useState("overview");
    const updateView = (newView) => {
        setView(newView);
    };
    const items = [
        {
            title: 'Overview',
            itemId: 'overview'
        }

    ];

    const fetchFeatures = async () => {
        try {
            const table = "featuremetadata";
            const response = await fetch(`/api/list_table_rows?table=${table}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            const data = await response.json();
            if (data.length > 0) {
                const csvColumns = Object.keys(data[0]);
                // TODO: set word-break:normal on the feature name
                setColumns(csvColumns.map((column) => ({ Header: column, accessor: column, canFilter: false })));
            }
            setData(data);
            setInitialData(data);
        } catch (error) {
            console.error(error);
        }
    };

    const featureByModel = (row) => {
        const feature = row["Feature"].toLowerCase();
        return featureToModels[feature]?.join(",");
    }

    const fetchModelFeatureMappings = async () => {
        try {
            const response = await fetch('/api/models',
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                    }
                });
            const data = await response.json();
            const modelFeaturesArr = await Promise.all(data.deployed_models.map(async (model) => {
                const featureJson = model.feature_names_json_path;
                const featuresResponse = await fetch(`/api/download_blob?file=${featureJson}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                        }
                    });
                const featureData = await featuresResponse.json();
                const parsed = JSON.parse(featureData);
                const features = (parsed['num_feat'] || [])
                    .concat(parsed['cat_feat_binary'] || [])
                    .concat(parsed['cat_feat_num'] || [])
                    .concat(parsed['cat_feat_string'] || []);
                return {
                    'name': model.model_name,
                    'value': features
                }
            }));
            const modelFeaturesMap = modelFeaturesArr.reduce((acc, val) => {
                if (val['value'].length > 0) {
                    acc[val['name']] = val['value'].map((v) => v.toLowerCase());
                }
                return acc;
            }, {});
            setModelToFeatures(modelFeaturesMap);
            const featureModelsMap = modelFeaturesArr.reduce((acc, val) => {
                const model = val['name'];
                if (val['value'].length > 0) {
                    val['value'].forEach((v) => {
                        const feature = v.toLowerCase();
                        if (!acc[feature]) {
                            acc[feature] = [];
                        }
                        acc[feature].push(model);
                    })
                }
                return acc;
            }, {});
            setFeatureToModels(featureModelsMap);
        } catch (error) {
            console.error("Error fetching model to feature mappings", error);
        }

    }

    useEffect(() => {
        fetchFeatures();
        fetchModelFeatureMappings();
    }, []);


    useEffect(() => {
        // Check if object not empty
        if (JSON.stringify(featureToModels) !== '{}') {
            if (columns.map(c => c.Header).includes("Models")) {
                return;
            }
            // Add column Models to the table
            setColumns([...columns, { Header: "Models", accessor: featureByModel, canFilter: false }]);
        }
    }, [featureToModels]);

    useEffect(() => {
        if (modelToFeatures) {
            const selectEl = document.querySelector('#select-model-box-id');
            if (selectEl) {
                new GDK.MultipleSelectBox({
                    "content": "#select-model-box-id"
                });
                selectEl.addEventListener('change', (e) => {
                    const selectedData = Array.from(selectEl.selectedOptions, option => option.text);
                setSelectedModels(selectedModels);
            });
        }
    }
    }, [modelToFeatures]);

    useEffect(() => {
        filterTable();
    }, [searchValue]);

    const constructGraph = (features) => {
        // Set graph with maps and features
        const graphData = {
            nodes: [
            ],
            links: [
            ]
        }
        const modelSet = new Set();
        for (const feature of features) {
            featureToModels[feature].forEach(m => modelSet.add(m));
        }
        for (const feature of features) {
            graphData.nodes.push({
                id: feature, label: feature.toUpperCase()
            });
            graphData.links = graphData.links.concat(featureToModels[feature].map((model) => {
                return { source: feature, target: model }
            }));
        }
        for (const model of modelSet) {
            graphData.nodes.push({
                id: model, label: model.toUpperCase(), size: 20
            });
        }
        return graphData;
    }

    const filterTable = () => {
        if (initialData.length > 0) {
            let filteredData = initialData;
            if (searchValue) {
                filteredData = filteredData.filter((el) => {
                    return el[field]?.toLowerCase().includes(searchValue.toLowerCase());
                });
            }
            if (selectedModels.length > 0) {
                // Get intersection of features between selected models:
                const modelFeatures = new Set(selectedModels.map((model) => modelToFeatures[model]).flat());
                //const featureIntersection = modelFeatures.reduce((a, b) => a.filter(c => b.includes(c)));
                filteredData = filteredData.filter((el) => {
                    return modelFeatures.has(el["Feature"].toLowerCase());
                });
                // TODO: not all features appear in the table even though they should
                const tableFeatures = filteredData.map(el => el["Feature"].toLowerCase()).filter(el => modelFeatures.has(el));
                setGraphData(constructGraph(tableFeatures));
            }
            setData(filteredData);
        }
    }

    useEffect(() => {
        filterTable();
    }, [selectedModels]);

    useEffect(() => {
        if (!switchButton) {
            switchButton = new GDK.ButtonSwitch({
                content: "#toggle-graph-view",
                initiallyChecked: false,
                onSwitchChange: function (buttonSwitchCheckedState) {
                    if (buttonSwitchCheckedState) {
                        setShowGraphView(true);
                    } else {
                        setShowGraphView(false);
                    }
                }
            });
        }
    }, [])

    const generateSortingIndicator = (column) => {
        return column.isSorted ? (column.isSortedDesc ? ' ▼' : ' ▲') : '';
    };

    const handleSelectChange = (e) => {
        setSearchValue("");
        setField(e.target.value);
    };

    const handleSelectModelChange = (e) => {
        // This is handled by jQuery
    }

    const handleInputChange = (e) => {
        setSearchValue(e.target.value);
    };

    return (
        <>
        {/*Display the Feature Store menu options only on the Feature Store page*/}
        {view === 'overview' && (
            <aside className="side-nav">
                <SideBarPanel title={"Feature Store"} items={items} active_view={view} updateView={updateView} />
            </aside>
        )}
            {view == "overview" &&
                <main role={"main"} id="wrapper" className='bg-color--cloudy'
                    style={{ paddingTop: "3.2em", marginLeft: "240px", marginTop: "8px" }}>
                    <div className="container">
                        <span className="p-2">
                            Filter By:
                        </span>
                        <div className="select-box" style={{ margin: "4px" }}>

                                    <select value={field} onChange={handleSelectChange} style={{ fontSize: "10pt" }}>
                                        <option value="">Select Feature Metadata</option>
                                        {columns.map((column, index) => {
                                            return (
                                                <option value={column.id} key={index}>
                                                    {column.Header}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <input
                                    type="text"
                                    style={{ fontSize: "10pt", margin: "4px" }}
                                    value={searchValue}
                                    onChange={handleInputChange}
                                    disabled={!field}
                                    placeholder={field ? `Search ${field} column...` : "Please select a field"} />
                                <div>
                                    <span className="p-2">
                                        Filter By Model:
                                    </span>
                                    <div className="select-box" style={{ fontSize: "10pt", margin: "8px" }}>
                                        <select multiple id="select-model-box-id" value={selectedModels} onChange={handleSelectModelChange}>
                                            <option value="">Select Model</option>
                                            {Object.keys(modelToFeatures).map((model, index) => {
                                                return (
                                                    <option value={model} key={index}>
                                                        {model}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>
                                <div id="toggle-graph-view" className="button-switch-container" style={{ marginBottom: "8px" }}>
                                    <div className="button-switch-label-wrapper" style={{ width: "auto" }}>
                                        <label htmlFor="toggle-graph-view-switch-checkbox" className="text">Show Graph View</label>
                                    </div>
                                    <input id="toggle-graph-view-switch-checkbox" name="toggle-graph-view-switch-checkbox" type="checkbox" />
                                    <div className="button-switch"></div>
                                </div>
                                {showGraphView &&
                                    <NetworkGraph data={graphData} />}
                                <div className="row data-table">
                                    <table {...getTableProps()} className="table" style={{ width: "100%" }}>
                                        <thead style={{ wordBreak: "keep-all" }}>
                                            {headerGroups.map(headerGroup => (
                                                <tr {...headerGroup.getHeaderGroupProps()}>
                                                    {headerGroup.headers.map(column => (
                                                        <th {...column.getHeaderProps()}>
                                                            <div {...column.getSortByToggleProps()}>
                                                                {column.render("Header")}
                                                                {generateSortingIndicator(column)}
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            ))}
                                        </thead>

                                <tbody {...getTableBodyProps()}>
                                    {rows.map(row => {
                                        prepareRow(row)
                                        return (
                                            <tr {...row.getRowProps()}>
                                                {row.cells.map(cell => {
                                                    return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                                                })}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            }
        </>
    );
};