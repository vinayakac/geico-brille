import { useState } from 'react';
import { FiFilter } from 'react-icons/fi';

export default function FeatureFilter({ onChange, filterName }) {
    const [filterStr, setFilterStr] = useState("");

    const handleStrChange = (e) => {
        const filterStr = e.target.value;
        setFilterStr(filterStr);
        onChange(filterStr);
    }
    return (
        <div className="filter-container" style={{ margin: "0 50px" }} id="feature_filter">
            <label>
                <span className="geico-icon icon-filter" style={{ verticalAlign: "text-bottom" }}>
                    <FiFilter size={16} />
                </span>
                {filterName}
            </label>
            <input type="text" style={{ margin: "10px 4px", height: "3rem" }} onChange={handleStrChange}></input>
        </div>
    );
}