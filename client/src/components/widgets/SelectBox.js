import { useState } from 'react';

/**
 * A component that renders a dropdown with possible data drift algorithms for numeric features.
 * 
 * @param {function} onUpdate - The function to call when algorithm selection was updated
 * @returns {JSX.Element} A react component
 */
export default function SelectBox({ onUpdate, optionsList, defaultOption="" }) {
    const [option, setOption] = useState(defaultOption);

    const onChange = (event) => {
        const selectedOption = event.target.value;
        setOption(selectedOption);
        onUpdate(selectedOption);
    }

    return (
        <div className="select-box panel-bar-selector">
            <select value={option} onChange={onChange}>
                {
                    optionsList.map((item, index) => {
                        return <option key={index}>{item}</option>
                    })
                }
            </select>
        </div>
    );
}
