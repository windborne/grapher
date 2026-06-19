import calculateTooltipState from '../src/state/calculate_tooltip_state';

function makeSeries({ data, bounds, name='Temperature' }) {
    const axis = {
        scale: 'linear',
        currentBounds: bounds,
        series: []
    };

    const series = {
        axis,
        inDataSpace: data,
        data,
        name
    };

    axis.series = [series];
    return series;
}

function calculate(options) {
    return calculateTooltipState({
        mousePresent: true,
        mouseX: 50,
        mouseY: 0,
        sizing: {
            elementWidth: 100,
            elementHeight: 100
        },
        series: [options.series],
        alwaysTooltipped: new Set(),
        savedTooltips: [],
        closestSpacing: 10,
        tooltipOptions: options.tooltipOptions
    });
}

describe('#calculateTooltipState', () => {
    it('keeps nearest-tooltip distance filtering by default', () => {
        const series = makeSeries({
            data: [[0, 0], [10, 10]],
            bounds: {
                minX: 0,
                maxX: 10,
                minY: 0,
                maxY: 10
            }
        });

        const result = calculate({ series });

        expect(result.tooltips).to.eql([]);
    });

    it('interpolates visible series at the hovered x value in interpolate mode', () => {
        const series = makeSeries({
            data: [[0, 0], [10, 10]],
            bounds: {
                minX: 0,
                maxX: 10,
                minY: 0,
                maxY: 10
            }
        });

        const result = calculate({
            series,
            tooltipOptions: {
                mode: 'interpolate'
            }
        });

        expect(result.tooltips).to.have.length(1);
        expect(result.tooltips[0].x).to.equal(5);
        expect(result.tooltips[0].y).to.equal(5);
        expect(result.tooltips[0].pixelX).to.equal(50);
        expect(result.tooltips[0].ignoreYDistanceCheck).to.equal(true);
    });

    it('preserves Date x values when interpolate mode handles date axes', () => {
        const minX = Date.UTC(2026, 5, 18, 0);
        const maxX = Date.UTC(2026, 5, 18, 10);
        const series = makeSeries({
            data: [[new Date(minX), 0], [new Date(maxX), 10]],
            bounds: {
                minX,
                maxX,
                minY: 0,
                maxY: 10,
                dates: true
            }
        });

        const result = calculate({
            series,
            tooltipOptions: {
                mode: 'interpolate'
            }
        });

        expect(result.tooltips).to.have.length(1);
        expect(result.tooltips[0].x).to.be.an.instanceOf(Date);
        expect(result.tooltips[0].x.getTime()).to.equal((minX + maxX) / 2);
        expect(result.tooltips[0].y).to.equal(5);
    });
});
