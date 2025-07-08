import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Grapher from './grapher.jsx';
import MultigraphStateController from './state/multigraph_state_controller.js';
import {useDraggingY, useMultiSeries} from './state/hooks.js';
import SyncPool from './state/sync_pool.js';

export default React.memo(MultiGrapher);


function MultiGrapher(props) {
    /* eslint-disable react/prop-types */

    const multigrapherID = useMemo(() => Math.random().toString(36).slice(2), []);

    const multigraphStateController = useMemo(() => new MultigraphStateController({
        id: multigrapherID,
        ...props
    }), []);

    const multiSeries = useMultiSeries(multigraphStateController);

    const syncPool = useMemo(() => new SyncPool({
        syncBounds: props.syncBounds,
        syncTooltips: props.syncTooltips,
        syncDragState: true
    }), []);

    const registerStateController = useMemo(() => multigraphStateController.registerStateController.bind(multigraphStateController), [multigraphStateController]);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            window.multigraphStateController = multigraphStateController;
        }

        return () => {
            multigraphStateController.dispose();
        };
    }, [multigraphStateController]);

    useEffect(() => {
        props.exportStateController && props.exportStateController(multigraphStateController);
    }, [multigraphStateController, props.exportStateController]);

    useEffect(() => {
        multigraphStateController.setSeries(props.series);
    }, [multigraphStateController, props.series]);

    useEffect(() => {
        if (!props.onMultiseriesChange) {
            return () => {};
        }

        multigraphStateController.on('multi_series_changed', props.onMultiseriesChange);
        return () => {
            multigraphStateController.off('multi_series_changed', props.onMultiseriesChange);
        };
    }, [multigraphStateController, props.onMultiseriesChange]);

    const draggingY = useDraggingY(multigraphStateController);

    return (
        <div className="multigrapher">
            {
                draggingY && props.newUpperEnabled &&
                    <div className={`new-grapher grapher-${props.theme}`} data-grapher-id={`multigrapher-${multigrapherID}-top`}>
                        New grapher
                    </div>
            }

            {
                multiSeries.map((series, i) =>
                    <Grapher
                        key={i}
                        {...props}
                        syncPool={syncPool}
                        stateControllerInitialization={multigraphStateController.stateControllerInitialization}
                        series={series}
                        id={`multigrapher-${multigrapherID}-${i}`}
                        dragPositionYOffset={props.newUpperEnabled ? 38 : 0}
                        exportStateController={registerStateController}
                    />
                )
            }

            {
                draggingY &&
                <div className={`new-grapher grapher-${props.theme}`} data-grapher-id={`multigrapher-${multigrapherID}-bottom`}>
                    New grapher
                </div>
            }
        </div>
    );
}

MultiGrapher.defaultProps = {
    theme: 'night'
};

MultiGrapher.propTypes = Object.assign({}, Grapher.propTypes, {
    syncBounds: PropTypes.bool,
    syncTooltips: PropTypes.bool,
    newUpperEnabled: PropTypes.bool,
    onMultiseriesChange: PropTypes.func
});
