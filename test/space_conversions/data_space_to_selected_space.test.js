import dataSpaceToSelectedSpace from '../../src/state/space_conversions/data_space_to_selected_space';

describe('#dataSpaceToSelectedSpace', () => {
    it('handles basic interpolation', () => {
        const result = dataSpaceToSelectedSpace({
            data: [[0, 0], [1, 1], [2, 2]],
            minX: 0.5,
            maxX: 1.5,
            ignoreDiscontinuities: true,
            square: false
        });
        expect(result.data).to.eql([[0.5, 0.5], [1, 1], [1.5, 1.5]]);

        const result2 = dataSpaceToSelectedSpace({
            data: [[0, 1], [1, 1], [2, 1], [3, 3]],
            minX: 0.5,
            maxX: 1.5,
            ignoreDiscontinuities: true,
            square: false,
            swap: result
        });
        expect(result2.data).to.eql([[0.5, 1], [1, 1], [1.5, 1]]);
    });

    it('handles basic selection', () => {
        const result = dataSpaceToSelectedSpace({
            data: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]],
            minX: 1,
            maxX: 3,
            ignoreDiscontinuities: true,
            square: false
        });
        expect(result.data).to.eql([[1, 1], [2, 2], [3, 3]]);

        const result2 = dataSpaceToSelectedSpace({
            data: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]],
            minX: 1,
            maxX: 3,
            ignoreDiscontinuities: true,
            square: false,
            swap: result
        });
        expect(result2.data).to.eql([[1, 1], [2, 2], [3, 3]]);

        const result3 = dataSpaceToSelectedSpace({
            data: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]],
            minX: 0,
            maxX: 5,
            ignoreDiscontinuities: true,
            square: false,
            swap: result2
        });
        expect(result3.data).to.eql([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
    });

    it('handles too-wide selection', () => {
        const result = dataSpaceToSelectedSpace({
            data: [[1, 1], [2, 2], [3, 3]],
            minX: -10,
            maxX: 30,
            ignoreDiscontinuities: true,
            square: false
        });
        expect(result.data).to.eql([[-10, null], [1, 1], [2, 2], [3, 3], [30, null]]);

        const result2 = dataSpaceToSelectedSpace({
            data: [[1, 1], [2, 2], [3, 3]],
            minX: -10,
            maxX: 30,
            ignoreDiscontinuities: true,
            square: false,
            swap: result
        });
        expect(result2.data).to.eql([[-10, null], [1, 1], [2, 2], [3, 3], [30, null]]);
    });

    it('handles duplicate values at beginning and end', () => {
        for (let square of [true, false]) {
            const result = dataSpaceToSelectedSpace({
                data: [[1, 1], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3]],
                minX: 1,
                maxX: 3,
                ignoreDiscontinuities: true,
                square
            });
            expect(result.data).to.eql([[1, 1], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3]]);

            const result2 = dataSpaceToSelectedSpace({
                data: [[1, 1], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3]],
                minX: 1,
                maxX: 3,
                ignoreDiscontinuities: true,
                square,
                swap: result
            });
            expect(result2.data).to.eql([[1, 1], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3]]);
        }
    });

    it('handles duplicate values at beginning and end with too wide bounds', () => {
        for (let square of [true, false]) {
            const result = dataSpaceToSelectedSpace({
                data: [[1, 1], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3]],
                minX: 0,
                maxX: 4,
                ignoreDiscontinuities: true,
                square
            });
            expect(result.data).to.eql([[0, null], [1, 1], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3], [4, null]]);

            const result2 = dataSpaceToSelectedSpace({
                data: [[1, 1], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3]],
                minX: 0,
                maxX: 4,
                ignoreDiscontinuities: true,
                square,
                swap: result
            });
            expect(result2.data).to.eql([[0, null], [1, 1], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3], [4, null]]);
        }
    });

    it('handles square interpolation', () => {
        const result = dataSpaceToSelectedSpace({
            data: [[1, 1], [2, 1], [2, 2], [3, 2], [3, 3]],
            minX: 1,
            maxX: 2.5,
            ignoreDiscontinuities: true,
            square: true
        });
        expect(result.data).to.eql([[1, 1], [2, 1], [2, 2], [2.5, 2]]);

        const result2 = dataSpaceToSelectedSpace({
            data: [[1, 1], [2, 1], [2, 2], [3, 2], [3, 3]],
            minX: 1,
            maxX: 2.5,
            ignoreDiscontinuities: true,
            square: true,
            swap: result
        });
        expect(result2.data).to.eql([[1, 1], [2, 1], [2, 2], [2.5, 2]]);
    });

    it('ignores discontinuities', () => {
        const result = dataSpaceToSelectedSpace({
            data: [[1, 1], [2, null], [3, 3]],
            minX: -10,
            maxX: 30,
            ignoreDiscontinuities: true,
            square: false
        });
        expect(result.data).to.eql([[-10, null], [1, 1], [3, 3], [30, null]]);

        const result2 = dataSpaceToSelectedSpace({
            data: [[1, 1], [2, null], [3, 3]],
            minX: -10,
            maxX: 30,
            ignoreDiscontinuities: true,
            square: false,
            swap: result
        });
        expect(result2.data).to.eql([[-10, null], [1, 1], [3, 3], [30, null]]);
    });

    it('handles discontinuities at boundaries', () => {
        const result = dataSpaceToSelectedSpace({
            data: [[0, 0], [1, null], [2, 2], [3, null]],
            minX: 1,
            maxX: 3,
            ignoreDiscontinuities: true,
            square: false
        });
        expect(result.data).to.eql([[1, 1], [2, 2], [3, null]]);

        const result2 = dataSpaceToSelectedSpace({
            data: [[1, null], [2, 2], [3, null], [4, 4]],
            minX: 1,
            maxX: 3,
            ignoreDiscontinuities: true,
            square: false,
            swap: result
        });
        expect(result2.data).to.eql([[1, null], [2, 2], [3, 3]]);
    });

    it('handles moving selection back', () => {
        const result = dataSpaceToSelectedSpace({
            data: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]],
            minX: 2.5,
            maxX: 5,
            ignoreDiscontinuities: true,
            square: false
        });
        expect(result.data).to.eql([[2.5, 2.5], [3, 3], [4, 4], [5, 5]]);

        const result2 = dataSpaceToSelectedSpace({
            data: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]],
            minX: 1,
            maxX: 3,
            ignoreDiscontinuities: true,
            square: false,
            swap: result
        });
        expect(result2.data).to.eql([[1, 1], [2, 2], [3, 3]]);

        const result3 = dataSpaceToSelectedSpace({
            data: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]],
            minX: 0.5,
            maxX: 5,
            ignoreDiscontinuities: true,
            square: false,
            swap: result2
        });
        expect(result3.data).to.eql([[0.5, 0.5], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]);
    });

    it('handles no data between bounds', () => {
        const result = dataSpaceToSelectedSpace({
            data: [[0, 0], [3, 3]],
            minX: 1,
            maxX: 2,
            ignoreDiscontinuities: true,
            square: false
        });
        expect(result.data).to.eql([[1, 1], [2, 2]]);

        const result2 = dataSpaceToSelectedSpace({
            data: [[0, 0], [3, 3]],
            minX: 0.5,
            maxX: 3,
            ignoreDiscontinuities: true,
            square: false,
            swap: result
        });
        expect(result2.data).to.eql([[0.5, 0.5], [3, 3]]);
    });

    it('handles no data between bounds when square', () => {
        const result = dataSpaceToSelectedSpace({
            data: [[0, 0], [2, 2]],
            minX: 1,
            maxX: 1.5,
            ignoreDiscontinuities: true,
            square: true
        });
        expect(result.data).to.eql([[1, 0], [1.5, 0]]);

        const result2 = dataSpaceToSelectedSpace({
            data: [[0, 0], [2, 2]],
            minX: 1,
            maxX: 2,
            ignoreDiscontinuities: true,
            square: true,
            swap: result
        });
        expect(result2.data).to.eql([[1, 0], [2, 2]]);
    });

    it('handles one point in data', () => {
        const result = dataSpaceToSelectedSpace({
            data: [[0, 0], [1, 1], [2, 2]],
            minX: 1,
            maxX: 1,
            ignoreDiscontinuities: true,
            square: true
        });
        expect(result.data).to.eql([[1, 0], [1, 1], [1, 1]]);
    });

    it('handles interpolation past nulls', () => {
        const result = dataSpaceToSelectedSpace( {
            data: [[1, 1], [2, null], [3, null], [4, 4], [5, 5], [6, null], [7, 7]],
            minX: 3.5,
            maxX: 5.5,
            ignoreDiscontinuities: true,
            square: false
        });
        expect(result.data).to.eql([[3.5, 3.5], [4, 4], [5, 5], [5.5, 5.5]]);

        const result2 = dataSpaceToSelectedSpace( {
            data: [[1, 1], [2, null], [3, null], [4, 4], [5, 5], [6, null], [7, 7]],
            minX: 1,
            maxX: 7,
            ignoreDiscontinuities: true,
            square: false,
            swap: result
        });
        expect(result2.data).to.eql([[1, 1], [4, 4], [5, 5], [7, 7]]);

        const result3 = dataSpaceToSelectedSpace( {
            data: [[1, 1], [2, null], [3, null], [4, 4], [5, 5], [6, null], [7, 7]],
            minX: 2,
            maxX: 7,
            ignoreDiscontinuities: false,
            square: true,
            swap: result2
        });
        expect(result3.data).to.eql([[2, null], [3, null], [4, 4], [5, 5], [6, null], [7, 7]]);

        const result4 = dataSpaceToSelectedSpace( {
            data: [[1, 1], [2, null], [3, null], [4, 4], [5, 5], [6, null], [7, 7]],
            minX: 3,
            maxX: 5.5,
            ignoreDiscontinuities: false,
            square: true,
            swap: result3
        });
        expect(result4.data).to.eql([[3, null], [4, 4], [5, 5], [5.5, 5]]);

        const result5 = dataSpaceToSelectedSpace( {
            data: [[1, 1], [2, null], [3, null], [4, 4], [5, 5], [6, null], [7, 7]],
            minX: 3,
            maxX: 5.5,
            ignoreDiscontinuities: false,
            square: false,
            swap: result4
        });
        expect(result5.data).to.eql([[3, null], [4, 4], [5, 5], [5.5, null]]);
    });

    it('handles changing ignoreDiscontinuities', () => {
        const result = dataSpaceToSelectedSpace( {
            data: [[0, 0], [1, null], [2, null], [3, 3], [4, null], [5, 5], [6, 6]],
            minX: 1,
            maxX: 5.5,
            ignoreDiscontinuities: true,
            square: false
        });
        expect(result.data).to.eql([[1, 1], [3, 3], [5, 5], [5.5, 5.5]]);

        const result2 = dataSpaceToSelectedSpace( {
            data: [[0, 0], [1, null], [2, null], [3, 3], [4, null], [5, 5], [6, 6]],
            minX: 1,
            maxX: 5.5,
            ignoreDiscontinuities: false,
            square: false,
            swap: result
        });
        expect(result2.data).to.eql([[1, null], [2, null], [3, 3], [4, null], [5, 5], [5.5, 5.5]]);

        const result3 = dataSpaceToSelectedSpace( {
            data: [[0, 0], [1, null], [2, null], [3, 3], [4, null], [5, 5], [6, 6]],
            minX: 0,
            maxX: 4,
            ignoreDiscontinuities: true,
            square: true,
            swap: result2
        });
        expect(result3.data).to.eql([[0, 0], [3, 3], [4, 3]]);
    });

    it('handles all null data when square', () => {
        const result = dataSpaceToSelectedSpace( {
            data: [[0, null], [1, null], [2, null]],
            minX: 0,
            maxX: 2,
            ignoreDiscontinuities: true,
            square: true
        });
        expect(result.data).to.eql([[0, null], [2, null]]);

        const result2 = dataSpaceToSelectedSpace( {
            data: [[0, null], [1, null], [2, null]],
            minX: 0,
            maxX: 2,
            ignoreDiscontinuities: false,
            square: true
        });
        expect(result2.data).to.eql([[0, null], [1, null], [2, null]]);
    });

    it('handles no data to some data', () => {
        const result = dataSpaceToSelectedSpace({
            data: [],
            minX: 0.5,
            maxX: 1.5,
            ignoreDiscontinuities: true,
            square: false
        });
        expect(result.data).to.eql([[0.5, null], [1.5, null]]);

        const result2 = dataSpaceToSelectedSpace({
            data: [[0, 1], [1, 1], [2, 1], [3, 3]],
            minX: 0.5,
            maxX: 1.5,
            ignoreDiscontinuities: true,
            square: false,
            swap: result
        });
        expect(result2.data).to.eql([[0.5, 1], [1, 1], [1.5, 1]]);
    });

    it('handles null data to some data', () => {
        const result = dataSpaceToSelectedSpace({
            data: [[1, null], [2, null], [3, null]],
            minX: 0.5,
            maxX: 3.5,
            ignoreDiscontinuities: true,
            square: false
        });
        expect(result.data).to.eql([[0.5, null], [3.5, null]]);

        const result2 = dataSpaceToSelectedSpace({
            data: [[0, 0], [1, null], [2, null], [3, null], [3, 3], [4, 4]],
            minX: 0.5,
            maxX: 3.5,
            ignoreDiscontinuities: false,
            square: false,
            swap: result
        });
        expect(result2.data).to.eql([[0.5, null], [1, null], [2, null], [3, null], [3, 3], [3.5, 3.5]]);
    });

    it('handles changing ignoreDiscontinuities with firstAdded true', () => {
        const result = dataSpaceToSelectedSpace({
            data: [[1, 1], [2, 2], [2.5, null], [3, 3]],
            minX: 0.5,
            maxX: 3.5,
            ignoreDiscontinuities: true,
            square: false
        });
        expect(result.data).to.eql([[0.5, null], [1, 1], [2, 2], [3, 3], [3.5, null]]);

        const result2 = dataSpaceToSelectedSpace({
            data: [[1, 1], [2, 2], [2.5, null], [3, 3]],
            minX: 0,
            maxX: 2.5,
            ignoreDiscontinuities: false,
            square: false,
            swap: result
        });
        expect(result2.data).to.eql([[0, null], [1, 1], [2, 2], [2.5, null]]);
    });
});
