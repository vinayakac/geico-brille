import { Navigation } from 'react-minimal-side-navigation';
import 'react-minimal-side-navigation/lib/ReactMinimalSideNavigation.css';
import '../sidebar/Sidebar.css';

export const PipelineSidebar = ({ title, items, active_view, updateView }) => {

    return (
        <>
            <h5 id="pipeline_name" style={{ paddingLeft: "24px", marginTop: "8px", marginBottom: "7px" }}>{title}</h5>
            <span className="stroke-separator" style={{ marginBottom: 0 }}></span>
            <Navigation
                activeItemId={active_view}
                onSelect={({ itemId }) => {
                    updateView(itemId);
                }}
                items={items}
            />
        </>
    )
};