import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const ExportButton = ({ jsonData }) => {

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(jsonData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Query Result');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'trip_report.xlsx');
    }


    return (
        <button type="button" className="btn btn--secondary" style={{ marginLeft: "4px" }} onClick={exportToExcel}>
            Export Results to Excel
        </button>
    )
}