import React from 'react';
import  './Error.css';

/**
 * A component that renders custom error message.
 * 
 * @param {function} error - the error encountered
 * @returns {JSX.Element} A react component
 */

const SectionLoadingError = ({ error }) => {
  return (
    <div className="loading-error-container">
      <div className="loading-error-icon">
        <span className="geico-icon icon-alert"></span>
      </div>
      <p className="loading-error-text">
        We're sorry. This information failed to load {error}.{' '}
        <a href={window.location.href}>Retry</a>
      </p>
    </div>
  );
};

export default SectionLoadingError;