import { useState, useEffect } from 'react';

export function useEvent(eventSource, eventName, initialState=null, watch=[]) {
    if (typeof initialState === 'function') {
        const originalInitialState = initialState;
        initialState = () => originalInitialState;
    }

    const [value, setValue] = useState(initialState);

    useEffect(() => {
        const listener = (updatedValue) => {
            if (typeof updatedValue === 'function') {
                const originalUpdatedValue = updatedValue;
                updatedValue = () => originalUpdatedValue;
            }
            setValue(updatedValue);
        };

        eventSource.on(eventName, listener);
        return () => {
            eventSource.off(eventName, listener);
        };
    }, [...watch, setValue, eventSource]);

    return value;
}

export function usePrimarySize(stateController) {
    return useEvent(stateController, 'primary_size_change', stateController.primaryRenderer ? stateController.primaryRenderer.sizing : {
        elementWidth: 0,
        elementHeight: 0,
        renderWidth: 0,
        renderHeight: 0
    });
}

export function useAxes(stateController) {
    return useEvent(stateController, 'axes_changed', stateController.axes);
}

export function useSeries(stateController) {
    return useEvent(stateController, 'series_changed', stateController.series);
}

export function useHighlightedSeries(stateController) {
    return useEvent(stateController, 'highlighted_series_changed', stateController.highlightedSeries);
}

export function useRightAxisCount(stateController) {
    return useRightAxes(stateController).length;
}

export function useLeftAxisCount(stateController) {
    return useLeftAxes(stateController).length;
}

export function useRightAxes(stateController) {
    return useEvent(stateController, 'right_axes_changed', stateController.rightAxes);
}

export function useLeftAxes(stateController) {
    return useEvent(stateController, 'left_axes_changed', stateController.leftAxes);
}

export function useSelection(stateController) {
    return useEvent(stateController, 'selection_changed', stateController.selection);
}

export function useGlobalBounds(stateController) {
    return useEvent(stateController, 'global_bounds_changed', stateController.globalBounds);
}

export function useAxisBounds(stateController) {
    return useEvent(stateController, 'axis_bounds_changed', stateController.axes.map(({ currentBounds }) => currentBounds));
}

export function useBoundCalculator(stateController) {
    return useEvent(stateController, 'bound_calculator_changed', stateController.boundCalculator);
}

export function useShowIndividualPoints(stateController) {
    return useEvent(stateController, 'show_individual_points_changed', stateController.showIndividualPoints);
}

export function useAutoscaleY(stateController) {
    return useEvent(stateController, 'autoscale_y_changed', stateController.autoscaleY);
}

export function useBoundHistory(stateController) {
    return useEvent(stateController, 'bound_history_changed', stateController.boundHistory);
}

export function useAlwaysTooltipped(stateController) {
    return useEvent(stateController, 'always_tooltipped_changed', stateController.alwaysTooltipped);
}

export function useTooltipState(stateController) {
    return useEvent(stateController, 'tooltip_state_changed', stateController.tooltipState);
}

export function useContextMenu(stateController) {
    return useEvent(stateController, 'context_menu_position_changed', stateController.contextMenuState);
}

export function useDraggingY(stateController) {
    return useEvent(stateController, 'dragging_y_changed', stateController.draggingY);
}

export function usePercentile(stateController) {
    return useEvent(stateController, 'percentile_changed', stateController.percentile);
}

export function useShowingOptions(stateController) {
    return useEvent(stateController, 'showing_options_changed', stateController.showingOptions);
}

export function useMaxPrecision(stateController) {
    return useEvent(stateController, 'max_precision_changed', stateController.maxPrecision);
}

export function usePercentileAsymmetry(stateController) {
    return useEvent(stateController, 'percentile_asymmetry_changed', stateController.percentileAsymmetry);
}

export function useShowingSidebar(stateController) {
    return useEvent(stateController, 'showing_sidebar_changed', stateController.showingSidebar);
}

export function useShowingAnnotations(stateController) {
    return useEvent(stateController, 'showing_annotations_changed', stateController.showingAnnotations);
}

export function useMultiSeries(multigraphStateController) {
    return useEvent(multigraphStateController, 'multi_series_changed', multigraphStateController.multiSeries);
}

export function useAnnotationState(stateController) {
    return useEvent(stateController, 'annotations_changed', stateController.annotationState);
}

export function useSizing(stateController) {
    return useEvent(stateController, 'primary_size_change', stateController.sizing);
}

export function useTheme(stateController) {
    return useEvent(stateController, 'theme_change', stateController.theme);
}

export function useExportMode(stateController) {
    return useEvent(stateController, 'export_mode_change', stateController.exportMode);
}

export function useHasXEnum(stateController) {
    return useEvent(stateController, 'has_x_enum_change', stateController.hasXEnum);
}

export function useEnumMap(stateController) {
    return useEvent(stateController, 'enum_map_change', stateController.enumMap);
}

export function useXEnumMap(stateController) {
    return useEvent(stateController, 'x_enum_map_change', stateController.enumMap);
}
