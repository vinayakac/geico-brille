import React from 'react';
import  './Error.css';

/**
 * A component that renders custom loading message.
 * 
 * @returns {JSX.Element} A react component
 */

const LoadingMessage = () => {
  return (
    <div className="loading-container">
      <p className="loading-text">
        This information is loading ...
      </p>
    </div>
  );
};

export default LoadingMessage;