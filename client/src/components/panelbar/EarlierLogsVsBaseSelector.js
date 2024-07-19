import { useState } from 'react';

/**
 * A component that renders a dropdown with option of choosing earlier logs vs base dataset.
 * 
 * @param {function} onUpdate - The function to call when selection was updated
 * @returns {JSX.Element} A react component
 */
export default function EarlierLogsVsBaseSelector({ onUpdate }) {
    const [logsVsBase, setlogsVsBase] = useState();

    const onChange = (event) => {
        const selectedOption = event.target.value;
        setlogsVsBase(selectedOption);
        onUpdate(selectedOption);
    }

    return (
        <div className="select-box panel-bar-selector">
            <select style={{marginTop: "-10px"}} value={logsVsBase} onChange={onChange}>
                <option value=""> -- select Logs or Base -- </option>
                <option>Earlier Logs</option>
                <option>Base Dataset</option>
            </select>
        </div>
    );
}
