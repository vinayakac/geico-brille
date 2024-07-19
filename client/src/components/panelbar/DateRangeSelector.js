import { useState, useEffect } from 'react';
import '../../gdk/css/geico-design-kit.css';
import './panelBar.css'
/**
 * A component that renders 2 datepickers and passes the data upstream.
 * 
 * @param {function} onStartUpdate - The function to run when start date was updated
 * @param {function} onEndUpdate - The function to run when end date was updated
 * @param {funcation} errorMessage - Stores error messages encountered
 * @param {function} minDate - The min date allowed in date picker
 * @param {function} maxDate - The max date allowed in date picker
 * @returns {JSX.Element} A react component
 */
export default function DateRangeSelector({ onStartUpdate, onEndUpdate, errorMessage, minDate = new Date(2018, 1, 1), maxDate = new Date() }) {
    const [selectorId, setSelectorId] = useState(Math.floor(Math.random() * 100));
    const [endDate, setEndDate] = useState();
    const [startDate, setStartDate] = useState();

    useEffect(() => {
        onStartUpdate(startDate);
    }, [startDate]);

    useEffect(() => {
        onEndUpdate(endDate);
    }, [endDate]);

    useEffect(() => {
        new GDK.DatePicker({
            "content": "#start_date_" + selectorId,
            "monthYearDropdowns": true,
            "dateFormatShort": false,
            "minDate": minDate,
            "maxDate": maxDate,
            dateSelected: function (dateStr) {
                // Convert default MM/DD/YYYY date into YYYY-mm-DD
                const isoDate = new Date(dateStr).toISOString().slice(0, 10);
                errorMessage = "";
                setStartDate(isoDate);

            },
            "disabled": false
        });
        new GDK.DatePicker({
            "content": "#end_date_" + selectorId,
            "monthYearDropdowns": true,
            "dateFormatShort": false,
            "minDate": minDate,
            "maxDate": maxDate,
            dateSelected: function (dateStr) {
                // Convert default MM/DD/YYYY date into YYYY-mm-DD
                const isoDate = new Date(dateStr).toISOString().slice(0, 10);
                errorMessage = "";
                setEndDate(isoDate);
            },
            "disabled": false
        });
    }, []);

    return (
        <>
            <div className="form-field-start" style={{ marginRight: "10px", display: 'flex' }}>
                <label style={{ flexShrink: 0, lineHeight: '48px' }}>Start Date   </label>
                <input
                    id={"start_date_" + selectorId}
                    name="start_date"
                    className={errorMessage && errorMessage.startsWith("Start") ? 'date--short validation-failed' : 'date--short'}
                    type="tel"
                    placeholder="MM/DD/YYYY"
                    autoComplete="off"
                    spellCheck="false"
                    aria-label="Report Start Date"
                    style={{ margin: 0, padding: 0 }}>
                </input>
                <div className="error-message-start">
                    {errorMessage && errorMessage.startsWith("Start") ? errorMessage : ""}</div>
            </div>

            <div className="form-field-end" style={{ display: 'flex' }}>
                <label style={{ flexShrink: 0, lineHeight: '48px' }}>End Date </label>
                <input
                    id={"end_date_" + selectorId}
                    name="end_date"
                    className={errorMessage && errorMessage.startsWith("End") ? 'date--short validation-failed' : 'date--short'}
                    type="tel" placeholder="MM/DD/YYYY"
                    autoComplete="off"
                    spellCheck="false"
                    aria-label="Report End Date"
                    style={{ margin: 0, padding: 0 }}>
                </input>
                <div className="error-message-end">
                    {errorMessage && errorMessage.startsWith("End") ? errorMessage : ""}</div>
            </div>

        </>
    );
}