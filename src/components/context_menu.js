import React from 'react';
import PropTypes from 'prop-types';

export default class ContextMenu extends React.PureComponent {
    constructor(props) {
        super(props);
        this.setTextRef = this.setTextRef.bind(this);
    }
    
    setTextRef(ref) {
        this.textRef = ref;

        if (this.props.contextMenu.showing && this.textRef) {
            const range = document.createRange();
            const selection = window.getSelection();

            selection.removeAllRanges();

            range.selectNodeContents(this.textRef);
            selection.addRange(range);
            this.textRef.focus();
        }
    }
    
    formatDateTime(dateTimeStr) {
        const [datePart, timePart] = dateTimeStr.split(', ');

        const [month, day, year] = datePart.split('/');
        const formattedDate = `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;

        const [time, period] = timePart.split(' ');
        const [hours, minutes] = time.split(':');
        const formattedHours = hours.padStart(2, '0');
        const formattedTime = `${formattedHours}:${minutes} ${period}`;

        return `${formattedDate} ${formattedTime}`;
    }
    
    render() {
        const { x, y, showing, value } = this.props.contextMenu;

        const style = { left: x, top: y, width: '150px'};
        
        if (!showing || !value || value.toLocaleString() === 'Invalid Date') {
            return null;
        }

        const displayValue = value instanceof Date ? this.formatDateTime(value.toLocaleString()) : value;
        return (
            <div className="grapher-context-menu" style={style}>
                <div className="menu-item">
                    <div className="menu-text" autoFocus={true} ref={this.setTextRef}>
                        {displayValue}
                    </div>
                </div>
            </div>
        );
    }

}

ContextMenu.propTypes = {
    contextMenu: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        showing: PropTypes.bool.isRequired,
        value: PropTypes.oneOfType([
            PropTypes.instanceOf(Date),
            PropTypes.number,
            PropTypes.object
        ])
    }).isRequired
};
