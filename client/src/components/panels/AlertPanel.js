import ConfiguredAlerts from "../alerts/ConfiguredAlerts";
export default function AlertPanel({ model }) {
  return (
    <>
      <div>
        <ConfiguredAlerts model={model} />
      </div>
    </>
  );
}
