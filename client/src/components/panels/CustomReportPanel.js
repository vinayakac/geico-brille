import { useContext, useEffect, useState } from "react";
import CustomRunsCard from "../cards/CustomRunsCard";

export default function CustomReportPanel({model, customJobId, modelConfig}) {
    
    return (
        <>

            <CustomRunsCard model={model} jobId={customJobId} modelConfig={modelConfig} />

        </>
    );
}
