import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [7, 2, 4, 3, 6, 5, 2, 1, 5, 6, 5]
        .map((value, index) => ({
            x: new Date(Date.now() + index * 1000),
            y: value
        })),
        type: 'objects',
        xKey: 'x',
        yKey: 'y',
        showIndividualPoints: true,
        defaultAlwaysTooltipped: true,
        color: 'rgb(150, 150, 240)',
    },
    {
        data: [11, 9, 8, 10, 11, 12, 2, -2, -6, -5, -1, 3, 5, -4, -3, -2, 7, 8, 9, 5, 10, 15]
        .map((value, index) => ({
            x: new Date(Date.now() + index * 1000),
            y: value
        })),
        type: 'objects',
        xKey: 'x',
        yKey: 'y',
        showIndividualPoints: true,
        defaultAlwaysTooltipped: true,
        color: 'rgb(240, 150, 150)',
    }
];

/* eslint-disable react/prop-types */
function CustomTooltip({tooltips}) {
    if (!tooltips || tooltips.length === 0) {
        return null;
    }

    // Get multiplier from first tooltip to determine direction
    const multiplier = tooltips[0]?.multiplier || 1;
    const flipLeft = multiplier < 0;

    const containerStyle = {
        backgroundColor: 'white',
        border: '1px solid #ccc',
        padding: '8px 12px',
        borderRadius: '4px',
        marginLeft: flipLeft ? undefined : '8px',
        marginRight: flipLeft ? '8px' : undefined,
        transform: flipLeft ? 'translate(-100%, -50%)' : 'translateY(-50%)',
        width: 'max-content',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    };

    const rowStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

    const dotStyle = (color) => ({
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0
    });

    return (
        <div style={containerStyle}>
            {tooltips.map((tooltip, i) => {
                const xValue = tooltip.x instanceof Date 
                    ? tooltip.x.toLocaleTimeString() 
                    : tooltip.x;
                const yValue = typeof tooltip.y === 'number' 
                    ? tooltip.y.toFixed(1) 
                    : tooltip.y;
                
                return (
                    <div key={i} style={rowStyle}>
                        <div style={dotStyle(tooltip.color)}></div>
                        <div>
                            x: {xValue}, y: {yValue}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
/* eslint-enable react/prop-types */

const tooltipOptions = {
    customTooltip: CustomTooltip,
    combineTooltips: true
};

renderPage(
    <ExamplePage page="combined_tooltips_graph_2">
        <Grapher
            series={series}
            tooltipOptions={tooltipOptions}
        />
    </ExamplePage>
);
