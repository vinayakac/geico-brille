import { useState } from 'react';

/**
 * A component that renders a dropdown with possible data drift algorithms for numeric features.
 * 
 * @param {function} onUpdate - The function to call when algorithm selection was updated
 * @returns {JSX.Element} A react component
 */
export default function DriftAlgorithmSelector({ onUpdate, algorithmList, defaultAlg="jensenshannon" }) {
    const [algorithm, setAlgorithm] = useState(defaultAlg);

    const onChange = (event) => {
        const selectedOption = event.target.value;
        setAlgorithm(selectedOption);
        onUpdate(selectedOption);
    }

    return (
        <div className="select-box panel-bar-selector">
            <select value={algorithm} onChange={onChange}>
                {
                    algorithmList.map((algorithmItem, index) => {
                        return <option key={index}>{algorithmItem}</option>
                    })
                }
            </select>
        </div>
    );
}
