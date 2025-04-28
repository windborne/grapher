import React from 'react';
import PropTypes from 'prop-types';

export default class Annotations extends React.PureComponent {

    render() {
        const { bodyHeight, annotationState } = this.props;
        const { annotations, elementWidth } = annotationState;

        console.log('annotations in grapher', annotations);

        return (
            <div className="grapher-annotations">
                {
                    annotations.map(({ pixelX, width, content, lineOnly }, i) => {
                        if (lineOnly) {
                            return (
                                <div key={i} className="grapher-annotation" style={{ left: pixelX }}>
                                    <div
                                        className="annotation-marker"
                                        style={{ width: width, height: bodyHeight }}
                                    />
                                </div>
                            );
                        }

                        const textStyle = {
                            top: 21*i
                        };

                        if (elementWidth - pixelX < content.length*5.5) {
                            textStyle.left = pixelX - elementWidth;
                        } else {
                            textStyle.left = 0;
                        }

                        return (
                            <div key={i} className="grapher-annotation" style={{ left: pixelX }}>
                                <div
                                    className="annotation-marker"
                                    style={{ width: width, height: bodyHeight }}
                                />

                                <div className="annotation-text" style={textStyle}>
                                    {content}
                                </div>
                            </div>
                        );
                    })
                }
            </div>
        );
    }

}

Annotations.propTypes = {
    annotationState: PropTypes.shape({
        annotations: PropTypes.arrayOf(PropTypes.object).isRequired,
        elementWidth: PropTypes.number.isRequired
    }),
    bodyHeight: PropTypes.number,
    lineOnly: PropTypes.bool
};
