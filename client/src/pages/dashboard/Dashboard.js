import { useEffect, useState } from 'react';
import '../../gdk/css/geico-design-kit.css';
import ModelTable from '../../components/ModelTable';
import TotalPrediction from '../../components/TotalPrediction';
import Features from '../features/Features';
import PipelineOverview from '../pipelines/PipelineOverview';
import SideBarPanel from '../../components/panels/SideBarPanel';

export default function Dashboard() {
    // TODO [uerstory: 8270241]: Improve dashboard UI based on reorg.
    const [modelsNum, setModelsNum] = useState(0);
    const [monitoredModels, setMonitoredModels] = useState(0);
    const [view, setView] = useState("models");
    const updateView = (newView) => {
        setView(newView);
    };
    const items = [
        {
            title: 'Models',
            itemId: 'models'
        },
        {
            title: 'Pipelines',
            itemId: 'pipelines'
        },
        {
            title: 'Feature Store',
            itemId: 'features'
        }
    ];

    const fetchModels = async () => {
        try {
            const response = await fetch('/api/models', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('brille-token')}`
                }
            });
            const data = await response.json();
            const modelsNum = data.deployed_models.length;
            setModelsNum(modelsNum);
            setMonitoredModels(data.deployed_models.filter(m => m.monitoring_enabled).length);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    return (
        <>
            <div>
                <div className="page-header--wrapper" style={{ "marginTop": "3em" }}></div>

                {/*Display the homepage menu options only on the homepage*/}
                {view === 'models' && (
                    <aside className="side-nav">
                        <SideBarPanel title={""} items={items} active_view={view} updateView={updateView} />
                    </aside>
                )}
                {view === "models" &&
                    <main role={"main"} id="wrapper" className='bg-color--cloudy'
                        style={{ paddingTop: "3.2em", marginLeft: "240px", marginTop: "8px" }}>
                        <div className="container">
                            <div className="row cards-container promotional-cards promotional-cards--three-column"
                                style={{ overflowX: 'auto', marginBottom: '0' }}>
                                <div className="card" style={{ textAlign: 'center', minWidth: "16rem" }}>
                                    <h5>Active Deployments</h5>
                                    <h4 style={{ marginBottom: "0" }}>{modelsNum}</h4>
                                </div>
                                <TotalPrediction />
                                <div className="card" style={{ textAlign: 'center', minWidth: "16rem" }}>
                                    <h5>Models Monitored</h5>
                                    <h4 style={{ marginBottom: "0" }}>{monitoredModels}</h4>
                                </div>
                            </div>
                            <div className="row">
                                <ModelTable />
                            </div>
                        </div>
                    </main>
                }
                {view === "pipelines" && <PipelineOverview />}
                {view === "features" && <Features />}

                <script type="text/javascript" src="/static/js/geico-design-kit.bundle.js"></script>
                <script type="text/javascript" src="/static/js/custom.js"></script>
            </div>
        </>
    );
};
