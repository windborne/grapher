import { expect } from 'chai';
import { SHAPE_CODES, resolvePointShape, resolvePointColor, groupPointsByStyle } from '../src/renderer/point_shapes';

describe('point_shapes', () => {
    describe('resolvePointShape', () => {
        it('defaults to circle', () => {
            expect(resolvePointShape(undefined)).to.equal('circle');
            expect(resolvePointShape('not-a-shape')).to.equal('circle');
        });

        it('passes through valid shapes', () => {
            for (const shape of Object.keys(SHAPE_CODES)) {
                expect(resolvePointShape(shape)).to.equal(shape);
            }
        });

        it('evaluates functions against the point datum', () => {
            const point = [10, 20];
            point.datum = { source: 'mesh' };
            point.datumIndex = 3;

            const shapeFn = (datum, index) => {
                expect(index).to.equal(3);
                return datum.source === 'mesh' ? 'square' : 'circle';
            };

            expect(resolvePointShape(shapeFn, point)).to.equal('square');
        });

        it('falls back to circle when the function returns garbage or datum is missing', () => {
            expect(resolvePointShape(() => 'blob', [1, 2])).to.equal('circle');
            expect(resolvePointShape((datum) => datum && 'square', [1, 2])).to.equal('circle');
        });
    });

    describe('resolvePointColor', () => {
        it('returns null for no override', () => {
            expect(resolvePointColor(undefined, [1, 2])).to.equal(null);
            expect(resolvePointColor(() => undefined, [1, 2])).to.equal(null);
            expect(resolvePointColor(() => '', [1, 2])).to.equal(null);
        });

        it('passes through strings and function results', () => {
            expect(resolvePointColor('tomato', [1, 2])).to.equal('tomato');

            const point = [1, 2];
            point.datum = { source: 'mesh' };
            expect(resolvePointColor((datum) => (datum.source === 'mesh' ? '#e0a458' : null), point)).to.equal('#e0a458');
        });
    });

    describe('groupPointsByStyle', () => {
        const withDatum = (x, y, source) => {
            const point = [x, y];
            point.datum = { source };
            return point;
        };

        it('returns a single bucket for non-function options', () => {
            const points = [[1, 2], [3, 4]];
            expect(groupPointsByStyle(points, 'diamond', undefined))
                .to.deep.equal([{ shape: 'diamond', color: null, points }]);
            expect(groupPointsByStyle(points, undefined, 'tomato'))
                .to.deep.equal([{ shape: 'circle', color: 'tomato', points }]);
        });

        it('partitions by shape function, preserving order', () => {
            const a = withDatum(1, 1, 'sat');
            const b = withDatum(2, 2, 'mesh');
            const c = withDatum(3, 3, 'sat');

            const groups = groupPointsByStyle([a, b, c],
                (datum) => (datum.source === 'sat' ? 'circle' : 'square'), undefined);

            expect(groups).to.deep.equal([
                { shape: 'circle', color: null, points: [a, c] },
                { shape: 'square', color: null, points: [b] }
            ]);
        });

        it('partitions by shape and color jointly', () => {
            const a = withDatum(1, 1, 'sat');
            const b = withDatum(2, 2, 'mesh');
            const c = withDatum(3, 3, 'mesh');

            const groups = groupPointsByStyle([a, b, c],
                (datum) => (datum.source === 'sat' ? 'circle' : 'square'),
                (datum) => (datum.source === 'mesh' ? '#e0a458' : null));

            expect(groups).to.deep.equal([
                { shape: 'circle', color: null, points: [a] },
                { shape: 'square', color: '#e0a458', points: [b, c] }
            ]);
        });
    });
});
