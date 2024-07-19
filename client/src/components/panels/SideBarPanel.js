import { Navigation } from 'react-minimal-side-navigation';
import 'react-minimal-side-navigation/lib/ReactMinimalSideNavigation.css';
import "../sidebar/Sidebar.css";

export default function SideBarPanel({ title, items, active_view, updateView }) {

  return (
    <>
      <h5 id="model_name" style={{ paddingLeft: "24px", marginTop: "8px", marginBottom: "7px" }}>{title}</h5>
      <span className="stroke-separator" style={{ marginBottom: 0 }}></span>
      <div id="sidebar-navigation" className="sidebar">
        <Navigation
            activeItemId={active_view}
            onSelect={({ itemId }) => {
                updateView(itemId);
            }}
            items={items}
        />
      </div>
    </>
  );
}
