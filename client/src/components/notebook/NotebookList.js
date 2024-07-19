import React, { useState, useEffect } from 'react';
import jwt_decode from 'jwt-decode';

/**
 * A component that list notebooks from previous launch history 
 * @param {string} searchName - Seach for notebooks with specific patterns/names
 * @returns {JSX.Element} A react component
 */
export default function NotebookList({ searchName }) {
  const [email, setEmail] = useState(null);
  const [notebookData, setNotebookData] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setErrorMessage] = useState(null);


  function getEmail() {
    var currentToken = localStorage.getItem('brille-token');
    var decodedToken = jwt_decode(currentToken);
    return decodedToken.username.toLowerCase();
  }

  const listNotebook = async () => {
    try {
      const EmailAddress = getEmail();
      setEmail(EmailAddress);
      const response = await fetch(`/api/list_notebook?email=${EmailAddress}&notebookName=${searchName}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('brille-token')}`
          }

        });
      if (response.status == 200) {
        const data = await response.json();
        setNotebookData(data);
      } else {
        setErrorMessage("unable to open notebook");
        setMessage("No previous notebook launch history");
      }

    } catch (error) {
      console.log(error);
    }
  }

  function convertNanoToDateTime(nanoseconds) {
    const date = new Date(nanoseconds);
    return date.toISOString();
  }

  useEffect(() => {
    listNotebook();
  }, []);

  return (
    <>
      {message ? <div>{message}</div> :
        <div className="notebook-data">
          <b>Previous Notebook Launch History</b>
          <table className="table" style={{ width: '100%' }}>
            <thead><tr>
              <th>Notebook Link</th>
              <th>User Email</th>
              <th>Modified Date</th>
              <th>Created Date</th>
            </tr>
            </thead>
            <tbody>
              {notebookData.map(notebook => (
                <tr key={notebook.object_id}>
                  <td> <a href={`${notebook.url}/#notebook/${notebook.object_id}`}
                    target="_blank"
                    rel="noopener noreferrer">
                    {notebook.path.split('/').pop()}
                  </a>
                  </td>
                  <td>{notebook.path.split('/')[2]}</td>
                  <td>{convertNanoToDateTime(notebook.modified_at)}</td>
                  <td>{convertNanoToDateTime(notebook.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
    </>

  );
}
