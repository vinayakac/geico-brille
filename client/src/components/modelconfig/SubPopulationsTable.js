import { useState, useEffect } from "react";

export const SubPopulationsTable = ({ initSubPopulations, onUpdate }) => {
    const [subPopulations, setSubPopulations] = useState(initSubPopulations);
    const [selectorId, setSelectorId] = useState(Math.floor(Math.random() * 10000));
    const [modalInstance, setModalInstance] = useState(null);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [selectedValues, setSelectedValues] = useState({});

    useEffect(() => {
        setSubPopulations(initSubPopulations);
    }, [initSubPopulations]);

    useEffect(() => {
        if (!modalInstance) {
            const modal = new GDK.Modal({
                content: "#modal-id" + selectorId,
                autoShow: false
            });
            setModalInstance(modal);
        }
    }, []);

    useEffect(() => {
        onUpdate(subPopulations);
    }, [subPopulations]);

    const showModal = () => {
        if (modalInstance) {
            modalInstance.show();
        }
    };

    const updateValueBins = () => {
        const updatedSubPopulations = {
            ...subPopulations,
            [selectedFeature]: {
                ...subPopulations[selectedFeature],
                ...selectedValues
            }
        };
        setSubPopulations(updatedSubPopulations);
        modalInstance.hide();
    }

    const editSubPopulation = (featureName) => {
        setSelectedFeature(featureName);
        const toEdit = subPopulations[featureName];
        setSelectedValues(toEdit);
        showModal();
    };

    const deleteSubPopulation = (featureName) => {
        setSubPopulations(Object.fromEntries(
            Object.entries(subPopulations).filter(([sb]) => sb != featureName)));
    }

    const handleCheckboxUpdate = (featureValue) => {
        setSelectedValues({
            ...selectedValues,
            [featureValue]: !selectedValues[featureValue]
        });

    }

    const printSelectedValueBins = (featureValue) => {
        const selected = Object.keys(featureValue).filter(key => featureValue[key]);
        return selected.join(", ");
    }

    return (
        <>
            <div className="sub-populations">
                <div className="data-table dense">
                    <table className="table" style={{ width: "100%" }}>
                        <thead>
                            <tr>
                                <th>Feature/Request parameter</th>
                                <th>Tracked Values/Buckets</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(subPopulations).map((features, index) => (
                                <tr key={index}>
                                    <td className="">{features}</td>
                                    <td className="">{printSelectedValueBins(subPopulations[features])}</td>
                                    <td className="col--edit-control">
                                        <div onClick={() => editSubPopulation(features)}>
                                            <span className="geico-icon geico-icon--small geico-icon--actionable icon-edit"></span>
                                        </div>
                                        <div onClick={() => {deleteSubPopulation(features)}}>
                                            <span className="geico-icon geico-icon--small geico-icon--actionable icon-trash"></span>
                                        </div>

                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div id={"modal-id" + selectorId} className="modal">
                    <div className="modal-container">
                        <h5 className="modal-headline" style={{ alignContent: "center" }}>Edit Sub-Population Tracking</h5>
                        <div className="modal-content" style={{ placeItems: "left" }}>
                            {selectedValues &&
                                <div>
                                    {Object.keys(selectedValues).map((value, index) => (
                                        <div key={index}>
                                            <input type="checkbox"
                                                className="checkbox dense"
                                                id={selectorId + index}
                                                name={selectorId + index}
                                                checked={selectedValues[value]}
                                                value={selectedValues[value]}
                                                onChange={() => handleCheckboxUpdate(value)}
                                                style={{ display: "none" }}
                                            />
                                            <label htmlFor={selectorId + index} className="checkbox dense">
                                                {value}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            }
                        </div>
                        <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={updateValueBins}
                            style={{ justifyContent: "right", width: "fit-content" }}>
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};