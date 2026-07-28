import MultigraphStateController from '../src/state/multigraph_state_controller';
import {LINE_COLORS} from '../src/helpers/colors';

function makeSeries(name, extra = {}) {
    return { name, data: [[0, 1], [1, 2]], ...extra };
}

function controller() {
    return new MultigraphStateController({ id: 'test' });
}

function graphNames(msc) {
    return msc.multiSeries.map((graph) => graph.map(({ name }) => name));
}

function findModified(msc, name) {
    for (let graph of msc.multiSeries) {
        for (let singleSeries of graph) {
            if (singleSeries.name === name) {
                return singleSeries;
            }
        }
    }
    return null;
}

describe('MultigraphStateController', () => {
    it('splits series into graphs by their graph property', () => {
        const msc = controller();
        msc.setSeries([makeSeries('a'), makeSeries('b', { graph: 1 })]);

        expect(graphNames(msc)).to.deep.equal([['a'], ['b']]);
    });

    it('compacts sparse graph indices while preserving order', () => {
        const msc = controller();
        msc.setSeries([makeSeries('a', { graph: 4 }), makeSeries('b', { graph: 2 })]);

        expect(graphNames(msc)).to.deep.equal([['b'], ['a']]);
        expect(findModified(msc, 'b').multigrapherGraphIndex).to.equal(0);
        expect(findModified(msc, 'a').multigrapherGraphIndex).to.equal(1);
    });

    it('sorts graph indices numerically, not lexicographically', () => {
        const msc = controller();
        const series = [];
        for (let i = 0; i < 11; i++) {
            series.push(makeSeries(`s${i}`, { graph: i }));
        }
        msc.setSeries(series);

        expect(graphNames(msc).map(([name]) => name)).to.deep.equal(series.map(({ name }) => name));
    });

    it('moves a series to a new bottom graph and keeps state dense', () => {
        const msc = controller();
        msc.setSeries([makeSeries('a'), makeSeries('b')]);

        msc.moveSeries({ draggedSeries: findModified(msc, 'a'), axisIndex: 'new-left', graphIndex: 'bottom' });

        expect(graphNames(msc)).to.deep.equal([['b'], ['a']]);
        expect(msc._multiSeries.every((graph) => graph.length > 0)).to.equal(true);
        expect(findModified(msc, 'b').multigrapherGraphIndex).to.equal(0);
        expect(findModified(msc, 'a').multigrapherGraphIndex).to.equal(1);
    });

    it('moves a series to a new top graph and renumbers the rest', () => {
        const msc = controller();
        msc.setSeries([makeSeries('a'), makeSeries('b')]);

        msc.moveSeries({ draggedSeries: findModified(msc, 'b'), axisIndex: 'new-left', graphIndex: 'top' });

        expect(graphNames(msc)).to.deep.equal([['b'], ['a']]);
        expect(findModified(msc, 'b').multigrapherGraphIndex).to.equal(0);
        expect(findModified(msc, 'a').multigrapherGraphIndex).to.equal(1);
    });

    it('resolves numeric drop targets against rendered positions after a graph was emptied', () => {
        const msc = controller();
        msc.setSeries([makeSeries('a'), makeSeries('b', { graph: 1 }), makeSeries('c', { graph: 2 })]);

        // empty out the first graph; b and c become rendered graphs 0 and 1
        msc.moveSeries({ draggedSeries: findModified(msc, 'a'), axisIndex: '0', graphIndex: '1' });
        expect(graphNames(msc)).to.deep.equal([['b', 'a'], ['c']]);

        // dropping onto rendered graph 1 must land on the graph containing c
        msc.moveSeries({ draggedSeries: findModified(msc, 'a'), axisIndex: '0', graphIndex: '1' });
        expect(graphNames(msc)).to.deep.equal([['b'], ['c', 'a']]);
    });

    it('never duplicates a series across graphs through repeated moves and updates', () => {
        const msc = controller();
        const a = makeSeries('a');
        const b = makeSeries('b');
        const c = makeSeries('c');
        msc.setSeries([a, b, c]);

        msc.moveSeries({ draggedSeries: findModified(msc, 'a'), axisIndex: '0', graphIndex: 'bottom' });
        msc.setSeries([a, b, c]);
        msc.moveSeries({ draggedSeries: findModified(msc, 'b'), axisIndex: '0', graphIndex: 'bottom' });
        msc.setSeries([a, b, c]);

        const seen = graphNames(msc).flat().sort();
        expect(seen).to.deep.equal(['a', 'b', 'c']);
    });

    it('removes a series everywhere when it disappears from the series list, even after dragging', () => {
        const msc = controller();
        const a = makeSeries('a');
        const b = makeSeries('b');
        msc.setSeries([a, b]);
        msc.moveSeries({ draggedSeries: findModified(msc, 'a'), axisIndex: '0', graphIndex: 'bottom' });

        msc.setSeries([b]);

        expect(graphNames(msc)).to.deep.equal([['b']]);
    });

    it('keeps a dragged placement when the same series objects are set again', () => {
        const msc = controller();
        const a = makeSeries('a');
        const b = makeSeries('b');
        msc.setSeries([a, b]);
        msc.moveSeries({ draggedSeries: findModified(msc, 'a'), axisIndex: '0', graphIndex: 'bottom' });

        msc.setSeries([a, b]);

        expect(graphNames(msc)).to.deep.equal([['b'], ['a']]);
    });

    it('honors the graph property when a series is recreated with a new identity', () => {
        // mirrors how tacoma recreates series objects, persisting placement via the graph property
        const msc = controller();
        const a = makeSeries('a');
        const b = makeSeries('b');
        msc.setSeries([a, b]);
        msc.moveSeries({ draggedSeries: findModified(msc, 'a'), axisIndex: '0', graphIndex: 'bottom' });

        const graphOfA = findModified(msc, 'a').multigrapherGraphIndex;
        msc.setSeries([makeSeries('a', { graph: graphOfA }), b]);

        expect(graphNames(msc)).to.deep.equal([['b'], ['a']]);
    });

    it('moves the right series even when a stale copy of the dragged series is passed', () => {
        const msc = controller();
        msc.setSeries([makeSeries('a'), makeSeries('b')]);

        const staleCopy = { ...findModified(msc, 'a') };
        msc.moveSeries({ draggedSeries: staleCopy, axisIndex: '0', graphIndex: 'bottom' });

        expect(graphNames(msc)).to.deep.equal([['b'], ['a']]);
    });

    it('ignores moves for series that no longer exist', () => {
        const msc = controller();
        const a = makeSeries('a');
        const b = makeSeries('b');
        msc.setSeries([a, b]);
        const removed = { ...findModified(msc, 'a') };
        msc.setSeries([b]);

        msc.moveSeries({ draggedSeries: removed, axisIndex: '0', graphIndex: 'bottom' });

        expect(graphNames(msc)).to.deep.equal([['b']]);
    });

    it('assigns distinct colors to series added after removals', () => {
        const msc = controller();
        const a = makeSeries('a');
        const b = makeSeries('b');
        msc.setSeries([a, b]);

        // remove a; b keeps its color (the second line color)
        msc.setSeries([b]);

        // add c: it must not collide with b
        const c = makeSeries('c');
        msc.setSeries([b, c]);

        const colorB = findModified(msc, 'b').color;
        const colorC = findModified(msc, 'c').color;
        expect(colorB).to.not.equal(colorC);
    });

    it('keeps colors unique through add/remove churn until the palette is exhausted', () => {
        const msc = controller();
        let active = [];
        for (let i = 0; i < LINE_COLORS.length; i++) {
            active = [...active, makeSeries(`s${i}`)];
            msc.setSeries(active);
            // remove and re-add an early series to churn the bookkeeping
            if (i === 3) {
                const removed = active.splice(1, 1)[0];
                msc.setSeries(active);
                active.push(makeSeries(removed.name));
                msc.setSeries(active);
            }
        }

        const colors = msc.multiSeries.flat().map(({ color }) => color);
        expect(new Set(colors).size).to.equal(colors.length);
    });

    it('respects explicitly requested colors', () => {
        const msc = controller();
        msc.setSeries([makeSeries('a', { color: '#123456' }), makeSeries('b', { color: 3 })]);

        expect(findModified(msc, 'a').color).to.equal('#123456');
        expect(findModified(msc, 'b').color).to.equal(LINE_COLORS[3]);
    });

    it('emits graph_count_changed with the new and previous counts', () => {
        const msc = controller();
        msc.setSeries([makeSeries('a'), makeSeries('b')]);

        let observed = null;
        msc.on('graph_count_changed', (count, prevCount) => {
            observed = { count, prevCount };
        });

        msc.moveSeries({ draggedSeries: findModified(msc, 'a'), axisIndex: '0', graphIndex: 'bottom' });

        expect(observed).to.deep.equal({ count: 2, prevCount: 1 });
    });
});
