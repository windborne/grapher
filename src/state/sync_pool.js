export default class SyncPool {

    /**
     *
     * @param {Boolean} syncBounds
     * @param {Boolean|'onShift'} syncTooltips
     * @param {Boolean} syncDragState
     */
    constructor({ syncBounds=true, syncTooltips=true, syncDragState=false } = {}) {
        this._stateControllers = new Set();
        this._syncBounds = syncBounds;
        this._syncTooltips = syncTooltips;
        this._syncDragState = syncDragState;
    }

    add(stateController) {
        this._stateControllers.add(stateController);

        if (this._syncBounds) {
            this.syncBounds(stateController);
        }

        if (this._syncTooltips) {
            this.syncTooltips(stateController);
        }

        if (this._syncDragState) {
            this.syncDragState(stateController);
        }
    }

    remove(stateController) {
        this._stateControllers.delete(stateController);

        // TODO: remove listeners
        // (though since this is currently only called by stateController dispose, it probably doesn't matter)
    }

    syncDragState(stateController) {
        stateController.on('dragging_y_changed', (draggingY) => {
            for (let otherStateController of this._stateControllers) {
                if (stateController === otherStateController) {
                    continue;
                }

                if (draggingY) {
                    otherStateController.markDragStart();
                } else {
                    otherStateController.finalizeDrag(null, null);
                }
            }
        });
    }

    syncBounds(stateController) {
        stateController.on('bound_calculator_changed', (boundCalculator) => {
            for (let otherStateController of this._stateControllers) {
                if (stateController === otherStateController) {
                    continue;
                }

                otherStateController.boundCalculator = boundCalculator;
            }
        });
    }

    syncTooltips(stateController) {
        stateController.on('tooltip_state_changed', (tooltipState, stateArg) => {
            if (this._tooltipIgnoreState === stateArg) { // avoid cascading changes
                return;
            }

            const shouldHideTooltips = tooltipState.unsavedTooltipsCount === 0 ||
                !tooltipState.mousePresent ||
                (this._syncTooltips === 'onShift' && !stateController.shiftKeyPressedOnMove);

            if (shouldHideTooltips) {
                this._tooltipIgnoreState = Math.random();
            }

            for (let otherStateController of this._stateControllers) {
                if (stateController === otherStateController) {
                    continue;
                }

                if (shouldHideTooltips) {
                    otherStateController.showOnlySavedTooltips(this._tooltipIgnoreState);
                    continue;
                }

                otherStateController.setTooltipMousePosition({
                    mouseX: tooltipState.mouseX,
                    mouseY: tooltipState.mouseY,
                    tooltipAllNext: true,
                    tooltipStateArg: this._tooltipIgnoreState
                });
            }
        });
    }

}
