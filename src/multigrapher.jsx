import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Grapher from './grapher.jsx';
import MultigraphStateController from './state/multigraph_state_controller.js';
import {useDraggingY, useMultiSeries} from './state/hooks.js';
import SyncPool from './state/sync_pool.js';

export default React.memo(MultiGrapher);

const multiGrapherDefaultProps = {
    theme: 'night'
};

function MultiGrapher(props) {
    /* eslint-disable react/prop-types */

    props = {...multiGrapherDefaultProps, ...props};

    const multigrapherID = useMemo(() => Math.random().toString(36).slice(2), []);

    const createControllerState = (controllerGeneration) => ({
        multigraphStateController: new MultigraphStateController({
            id: multigrapherID,
            ...props
        }),
        syncPool: new SyncPool({
            syncBounds: props.syncBounds,
            syncTooltips: props.syncTooltips,
            syncDragState: true
        }),
        controllerGeneration
    });

    const [{ multigraphStateController, syncPool, controllerGeneration }, setControllerState] = useState(() => createControllerState(0));

    const multiSeries = useMultiSeries(multigraphStateController);

    const registerStateController = useMemo(() => multigraphStateController.registerStateController.bind(multigraphStateController), [multigraphStateController]);

    useEffect(() => {
        // A preserved-state remount (StrictMode dev, <Activity> re-show) lands
        // here with the controller already disposed and its shared subscription
        // map cleared — recreate controller + sync pool and re-key the children.
        if (multigraphStateController.disposed) {
            // Constructed outside the updater (updaters must stay pure under
            // StrictMode); the key change discards children before they can
            // wire into the cleared shared state.
            setControllerState(createControllerState(controllerGeneration + 1));
            return;
        }

        if (process.env.NODE_ENV === 'development') {
            window.multigraphStateController = multigraphStateController;
        }

        return () => {
            multigraphStateController.dispose();
        };
    }, [multigraphStateController]);

    useEffect(() => {
        if (multigraphStateController.disposed) {
            // Replacement is scheduled; this re-runs with the fresh instance.
            return;
        }
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
                        key={`${controllerGeneration}-${i}`}
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

MultiGrapher.propTypes = Object.assign({}, Grapher.propTypes, {
    syncBounds: PropTypes.bool,
    syncTooltips: PropTypes.bool,
    newUpperEnabled: PropTypes.bool,
    onMultiseriesChange: PropTypes.func
});
