import React from 'react';
import PropTypes from 'prop-types';

export default class Annotations extends React.PureComponent {

    render() {
        const { bodyHeight, annotationState } = this.props;
        const { annotations, elementWidth } = annotationState;

        const validAnnotations = annotations.filter(a => a.pixelStartX !== undefined && a.pixelWidth !== undefined);

        return (
            <div className="grapher-annotations">
                {
                    validAnnotations.map(({ pixelStartX, pixelWidth, content, isRange, lineOnly }, i) => {
                        const annotationStyle = {
                            left: pixelStartX
                        };

                        if (isRange) {
                            return (
                                <div key={`range-${i}`} className="grapher-annotation grapher-annotation-range" style={annotationStyle}>
                                    <div
                                        className="annotation-range-marker"
                                        style={{ width: pixelWidth, height: bodyHeight }}
                                    />
                                </div>
                            );
                        } else {
                            const pointMarkerWidth = lineOnly ? pixelWidth : Math.max(pixelWidth, 1);

                            const textStyle = {};
                            if (content) {
                                textStyle.top = 21 * i;
                                textStyle.position = 'absolute';
                                const approxTextWidth = (content || '').length * 5.5;
                                if (elementWidth > 0 && elementWidth - pixelStartX < approxTextWidth + 10) {
                                    textStyle.left = -approxTextWidth - 5;
                                    textStyle.textAlign = 'right';
                                } else {
                                    textStyle.left = pointMarkerWidth + 5;
                                }
                            }

                            return (
                                <div key={`point-${i}`} className="grapher-annotation grapher-annotation-point" style={annotationStyle}>
                                    <div
                                        className="annotation-marker"
                                        style={{ width: pointMarkerWidth, height: bodyHeight }}
                                    />
                                    {content && !lineOnly &&
                                        <div className="annotation-text" style={textStyle}>
                                            {content}
                                        </div>
                                    }
                                </div>
                            );
                        }
                    })
                }
            </div>
        );
    }
}

Annotations.propTypes = {
    annotationState: PropTypes.shape({
        annotations: PropTypes.arrayOf(PropTypes.shape({
            pixelStartX: PropTypes.number,
            pixelWidth: PropTypes.number,
            content: PropTypes.string,
            isRange: PropTypes.bool,
            lineOnly: PropTypes.bool
        })).isRequired,
        elementWidth: PropTypes.number.isRequired
    }),
    bodyHeight: PropTypes.number
};
