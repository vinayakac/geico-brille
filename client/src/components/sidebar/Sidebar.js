import { Navigation } from 'react-minimal-side-navigation';
import 'react-minimal-side-navigation/lib/ReactMinimalSideNavigation.css';
import { useSearchParams } from 'react-router-dom';
import './Sidebar.css';

export const Sidebar = ({ model, enabled_features, active_view, updateView }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const items = [
        { title: 'Overview', itemId: 'monitoring' },
        { title: 'Model Info', itemId: 'summary' },
        { title: 'Training', itemId: 'training' },
        { title: 'Deployment', itemId: 'deployment' },
        { title: 'Data', itemId: 'data' },
        { title: 'Tests', itemId: 'tests' },
        {
            title: 'Monitoring',
            subNav: [
                {
                    title: 'Subpopulation',
                    itemId: 'subpopulation'
                },
                {
                    title: 'Configuration',
                    itemId: 'config'
                },
                {
                    title: 'Feature Importance',
                    itemId: 'feature-importance',
                },
                {
                    title: 'Custom Reports',
                    itemId: 'custom-reports',
                },
                {
                    title: 'Alerts',
                    itemId: 'alerts'
                },
                {
                    title: 'Weekly Reports',
                    itemId: 'weekly-reports'
                },
            ]
        }
    ]
 // Before using unshift, ensure `subNav` is initialized.
items.forEach(item => {
    if (!item.subNav) item.subNav = [];
  });

    if (enabled_features?.includes("data_drift") || enabled_features?.includes("drift")) {
        items[6].subNav.unshift({
            title: "Feature Drift",
            itemId: "drift"
        });
    }
    if (enabled_features?.includes("target_drift")) {
        items[6].subNav.unshift({
            title: 'Concept Drift',
            itemId: 'target-drift'
        });
    }
    if (enabled_features?.includes("prediction_drift")) {
        items[6].subNav.unshift({
            title: 'Prediction Drift',
            itemId: 'prediction-drift'
        });
    }
    if (enabled_features?.includes("model_performance")) {
        items[6].subNav.unshift({
            title: 'Model Performance',
            itemId: 'performance'
        })
    }

    return (
        <>
            <h5 id="model_name" style={{ paddingLeft: "24px", marginTop: "8px", marginBottom: "7px" }}>{model}</h5>
            <span className="stroke-separator" style={{ marginBottom: 0 }}></span>
            <Navigation
                activeItemId={active_view}
                onSelect={({ itemId }) => {
                    setSearchParams({ "view": itemId });
                    updateView(itemId);
                }}
                // TODO: combine all drifts into one Data Drift Section
                items={items}
            />
        </>
    )
};