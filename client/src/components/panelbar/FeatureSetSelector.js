import { useState, useEffect } from "react";

/**
 * A component that renders a dropdown with feature selector.
 *
 * @param {function} onUpdate - The function to call when feature set selection was updated
 * @param {string} jobId - The job ID to use when fetching the latest job
 * @param {string} model - The model to use when fetching the latest job
 * @param {string} zone - The zone to use when fetching the latest job
 * @param {string} type - The type to use when fetching the latest job
 * @returns {JSX.Element} A react component
 */
export default function FeatureSetSelector({
  onUpdate,
  jobId,
  model,
  zone,
  type,
}) {
  const [featureSet, setFeatureSet] = useState([]);
  const [jobResultFolder, setJobResultFolder] = useState();
  const [fullFeatureList, setFullFeatureList] = useState([]);
  const [message, setMessage] = useState(null);

  const fetchLatestJob = async () => {
    try {
      const response = await fetch(
        `/api/get_latest_job_run?model=${model}&type=${type}&jobId=${jobId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
          }
        }
      );
      if (response.status === 200) {
        const data = await response.json();
        const jobResultFolder = `${model}/${zone}/${type}/${data.run_id}`;
        setJobResultFolder(jobResultFolder);
      } else {
        setMessage("Execution error: " + response.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFeatureList = async () => {
    try {
      if (jobResultFolder) {
        const prefix = `${jobResultFolder}/details.parquet/feature=`;
        const response = await fetch(`/api/list_blobs?prefix=${prefix}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('brille-token')}`
            }
          });
        if (response.status === 200) {
          const data = await response.json();
          const featureList = data.map((blob) => {
            const splitBlob = blob.split("/");
            return splitBlob[splitBlob.length - 2].replace("feature=", "");
          });
          setFullFeatureList(featureList);
        } else {
          setMessage("Execution error fetch job by date: " + response.message);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchLatestJob();
  }, []);

  useEffect(() => {
    if (jobResultFolder) {
      fetchFeatureList();
    }
  }, [jobResultFolder]);

  const onChange = (event) => {
    const selectedOption = Array.from(
      event.target.selectedOptions,
      (option) => option.value
    );
    setFeatureSet(selectedOption);
    onUpdate(selectedOption);
  };
  return (
    <div
      className="select-box"
      style={{ display: "flex", alignItems: "center", width: "250px" }}
    >
      <label className="feature-selector" style={{ marginRight: "10px" }}>
        Feature Set:
      </label>
      <select multiple={true} value={featureSet} onChange={onChange}>
        <option value=""> --feature set -- </option>
        {fullFeatureList.map((feature, index) => (
          <option key={index} value={feature}>
            {feature}
          </option>
        ))}
      </select>
    </div>
  );
}
