import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3],
        rendering: 'shadow', 
        color: 'rgba(0, 160, 128, 1)',
        gradient: [
            [0.0, 'rgba(0, 160, 128, 0.3)'],  
            [0.3, 'rgba(0, 160, 128, 0.1)'],   
            [0.6, 'rgba(0, 0, 0, 0)']          
        ],
        width: 2,
        showIndividualPoints: true,
    }
];

renderPage(
    <ExamplePage page="shadow_chart">
        <Grapher
            series={series}
            showGrid={true}
            webgl={true}
        />
    </ExamplePage>
);
