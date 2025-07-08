import React from 'react';
import ReactDOM from 'react-dom';
import Grapher from '@windborne/grapher.jsx';

const rootEl = document.createElement('div');
document.body.appendChild(rootEl);
document.body.style.margin = '0';

window.renderGrapher = (props) => {
    if (props.title) {
        document.title = props.title;
    }
    ReactDOM.render(<Grapher {...props} />, rootEl);
};
