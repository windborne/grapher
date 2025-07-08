import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        name: 'Series 1',
        data: [],
        defaultAlwaysTooltipped: true
    },
    {
        name: 'Series 2',
        data: [],
        defaultAlwaysTooltipped: true
    }
];

for (let i = 0; i < 10000; i++) {
    series[0].data.push([
        new Date(Date.now() + i*1000),
        Math.cos(i/100)
    ]);

    series[1].data.push([
        new Date(Date.now() + i*1000),
        -Math.cos(i/500)
    ]);
}

/* eslint-disable react/prop-types */
function CustomTooltip({tooltips}) {
    const style = {
        backgroundColor: 'white',
        border: '1px solid black',
        padding: '5px',
        borderRadius: '5px',
        marginLeft: '5px',
        transform: 'translateY(-50%)',
        width: 'max-content'
    };

    return (
        <div style={style}>
            {
                tooltips.map(({label, x, y}, i) =>
                    <div key={i}>
                        <b>{label}</b> <br/>
                        x: {x.toLocaleString()}<br/>
                        y: {y.toFixed(2)}<br/>
                    </div>
                )
            }
        </div>
    );
}
/* eslint-enable react/prop-types */


const tooltipOptions = {
    customTooltip: CustomTooltip,
    combineTooltips: true
};

renderPage(
    <ExamplePage page="combined_tooltips_graph">
        <Grapher
            series={series}
            defaultBoundsCalculator="lastHour"
            clockStyle="12h"
            timeZone="utc"
            tooltipOptions={tooltipOptions}
        />
    </ExamplePage>
);
