import { useState } from 'react';

/**
 * A component that renders a dropdown with possible binning strategy selector.
 * 
 * @param {function} onUpdate - The function to call when binning strategy selection was updated
 * @returns {JSX.Element} A react component
 */
export default function BinningStrategySelector({ onUpdate }) {
    const [binningStrategy, setBinningStrategy] = useState();

    const onChange = (event) => {
        const selectedOption = event.target.value;
        setBinningStrategy(selectedOption);
        onUpdate(selectedOption);
    }

    return (
        <div className="select-box panel-bar-selector" style={{ display: 'flex', alignItems: 'center', width: '250px' }}>
            <label className="binning-selector" style={{ marginRight: '10px' }}>
                Binning Strategy:
            </label>
            <select value={binningStrategy} onChange={onChange}>
                <option value="">--binning strategy -- </option>
                <option>auto</option>
                <option>equal width</option>
                <option>equal height</option>
                <option>custom edges</option>
            </select>
        </div>
    );
}
