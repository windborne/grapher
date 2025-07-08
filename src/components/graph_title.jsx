import React from 'react';
import PropTypes from 'prop-types';

export default React.memo(GraphTitle);

function GraphTitle({ title }) {
    return (
        <div className="grapher-title">
            {title}
        </div>
    );
}

GraphTitle.propTypes = {
    title: PropTypes.string.isRequired
};
