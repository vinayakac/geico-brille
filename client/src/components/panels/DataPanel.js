import { SummaryCard } from "../cards/SummaryCard";
import { useEffect, useState } from "react";
export const DataPanel = ({ modelConfig }) => {
    const initialState = {
        hiddenColumns: ["etag", "partitionKey", "rowKey", "timestamp", "IsTimeWindow", "CodeLookUp", "IsCalculated", "Replacement", "Description", "DataType", "IsNullable", "SampleValues", "Version", "IsDeprecated"
        ]
    };
    const [columns, setColumns] = useState([]);
    const [data, setData] = useState([]);

    const selectedModels = [modelConfig.model_name]

    const fetchModelFeatureMappings = async () => {
        try {


            fetchFeatures(modelConfig);
            const featureJson = modelConfig.feature_names_json_path;
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
            const data = features.map(f => {
                const type = parsed['num_feat']?.includes(f) ? 'Numerical feature' : parsed['cat_feat_binary']?.includes(f) ? 'Categorical feature binary' : parsed['cat_feat_num']?.includes(f) ? 'Categorical feature number' : 'Categorical feature string';
                return { FeatureType: type, Feature: f }
            })


            setData(data)

        } catch (error) {
            console.error("Error fetching model to feature mappings", error);
        }
    }
    const fetchFeatures = async (modelToFeatures) => {
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
                const csvColumns = Object.keys(data[0])?.filter(colName => !initialState.hiddenColumns.includes(colName)) || [];
                // TODO: set word-break:normal on the feature name
                setColumns(csvColumns.map((column) => ({ Header: column, accessor: column, canFilter: false })));
            }




        } catch (error) {
            console.error(error);
        }
    };
    useEffect(() => {

        fetchModelFeatureMappings();
    }, [])


    return (
        <>
            <h4 style={{ padding: "10px 0 0 10px", color: "turquoise" }}>{modelConfig?.display_name}</h4>
                <div style={{ flex: 3, padding: "0 20px 0 10px" }}>
                    <div id="Model_information">
                        <SummaryCard title="Datasets">
                            <div id="Model_information_content">
                                <table>
                                <tr>
                                    <th style={{width:"16%"}}>Reference Path:</th>
                                    <td>{modelConfig?.baseline_path}</td>
                                </tr>
                                <tr>
                                    <th>Logs Path:</th>
                                    <td>{modelConfig?.logs_path}</td>
                                </tr>
                                <tr>
                                    <th>Predictions Path:</th>
                                    <td>{modelConfig?.predictions_path}</td>
                                </tr>
                                <tr>
                                    <th>Target Path:</th>
                                    <td>{modelConfig?.targets_path}</td>
                                </tr>
                                <tr>
                                    <th>Requests Path:</th>
                                    <td>{modelConfig?.request_path}</td>
                                </tr>
                            </table>
                            </div>
                        </SummaryCard>
                    </div>
                    <div id="Model_information">
                        <SummaryCard title="Features">
                            <div id="Model_information_content">
                                <table id="table-id" className="table">
                                    <thead>
                                        <tr>
                                            {columns?.map(column => <th key={column.accessor}>{column.Header}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data?.map((item, index) => (
                                            <tr key={index}>
                                                {columns.map(column => <td key={column.Header + index}>{item[column?.Header]}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </SummaryCard>
                    </div>

                <div style={{ flex: 1, padding: "0 20px 0 10px" }}>
                    <SummaryCard title={'Model Output'}>
                        <div id="prediction_column" style={{ display: 'flex', alignItems: 'center' }}>
                            <b>Prediction Column:</b>
                            <div style={{ border: '1px solid #ccc', padding: '5px', borderRadius: '5px', marginLeft: '5px' }}>{modelConfig?.prediction_column}
                            </div>
                        </div>
                        <div id="score_column" style={{ display: 'flex', alignItems: 'center' }}>
                            <b>Score Column:</b>
                            <div style={{ border: '1px solid #ccc', padding: '5px', borderRadius: '5px', marginLeft: '5px' }}>{modelConfig?.score_column}
                            </div>
                        </div>
                        <div id="target_column" style={{ display: 'flex', alignItems: 'center' }}>
                            <b>Target Column:</b>
                            <div style={{ border: '1px solid #ccc', padding: '5px', borderRadius: '5px', marginLeft: '5px' }}>{modelConfig?.target_column}
                            </div>
                        </div>
                    </SummaryCard>
                </div>
            </div>
        </>
    );
}