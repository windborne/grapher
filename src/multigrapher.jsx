import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Grapher from './grapher.jsx';
import MultigraphStateController from './state/multigraph_state_controller.js';
import {useDraggingY, useMultiSeries} from './state/hooks.js';
import SyncPool from './state/sync_pool.js';

export default React.memo(MultiGrapher);


function MultiGrapher(props) {
    /* eslint-disable react/prop-types */

    // Not defaultProps: React 19 removed defaultProps for function components
    props = {theme: 'night', ...props};

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
        // Cleanup disposes the controller on unmount. When the same component
        // instance mounts again with its state preserved (React StrictMode's
        // dev-mode double-invoke, an <Activity> boundary being shown again),
        // the retained controller is already disposed and its shared
        // subscription map is gone — recreate it together with the sync pool,
        // and re-key the child Graphers so the whole tree rebuilds against
        // the new shared state.
        if (multigraphStateController.disposed) {
            // Create outside the updater: updaters must be pure (StrictMode
            // double-invokes them), and this one constructs a controller and
            // sync pool. The recreate setStates from parent and children
            // batch into one top-down render, so the key change below
            // discards the children before any of them could wire into this
            // disposed parent's cleared shared state.
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
            // Don't hand consumers a disposed controller during the pass
            // that schedules its replacement; this effect re-runs with the
            // fresh instance after the swap.
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
