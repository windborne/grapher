use wasm_bindgen::prelude::*;
use js_sys::JsString;

#[wasm_bindgen]
extern "C" {
    pub type SelectedToRenderParams;

    #[wasm_bindgen(method, getter = renderWidth)]
    fn render_width(this: &SelectedToRenderParams) -> f64;
    #[wasm_bindgen(method, getter = renderHeight)]
    fn render_height(this: &SelectedToRenderParams) -> f64;
    #[wasm_bindgen(method, getter = minX)]
    fn min_x(this: &SelectedToRenderParams) -> f64;
    #[wasm_bindgen(method, getter = maxX)]
    fn max_x(this: &SelectedToRenderParams) -> f64;
    #[wasm_bindgen(method, getter = minY)]
    fn min_y(this: &SelectedToRenderParams) -> f64;
    #[wasm_bindgen(method, getter = maxY)]
    fn max_y(this: &SelectedToRenderParams) -> f64;
    #[wasm_bindgen(method, getter = scale)]
    fn scale(this: &SelectedToRenderParams) -> JsString;
}

#[inline]
fn value_space_to_render_space(y: f64, min_y : f64, max_y : f64, log_scale : bool, render_height : f64) -> f64 {
    let mut scaled_y = y;
    if log_scale {
        scaled_y = y.log10();
    }

    let percent = (scaled_y - min_y)/(max_y - min_y);

    return render_height * (1.0 - percent);
}

#[wasm_bindgen]
pub fn selected_space_to_render_space(length : usize, data : &[f64], data_null_mask : &[u8], params : &SelectedToRenderParams, null_mask: &mut [u8], y_values: &mut [f64], min_y_values: &mut [f64], max_y_values: &mut [f64]) {
    let min_x = params.min_x();
    let max_x = params.max_x();
    let min_y = params.min_y();
    let max_y = params.max_y();
    let render_width = params.render_width();
    let render_height = params.render_height();
    let log_scale = params.scale() == "log";

    let mut i : usize = 0;
    let mut prev_i : i32 = (i as i32) - 1;

    for pixel_x in 0..(render_width.ceil() as usize) {
        // find the x value that corresponds to the x pixel
        let x = ((pixel_x as f64)/((render_width as f64) - 1.0))*(max_x - min_x) + min_x;

        // set i such that data[i][0] < x <= data[i+1][0]
        let mut min_seen_y : Option<f64> = None;
        let mut max_seen_y : Option<f64> = None;

        if i > 0 && i <= length && data_null_mask[i - 1] > 0 {
            i -= 1;
        }

        if (i + 2) < length && data[2*(i + 1)] < x {
            i += 1;
        }

        while (i + 2) < length && data[2*(i + 1)] < x {
            if data_null_mask[i] > 0 {
                i += 1;
                continue;
            }

            let cur_y = data[2*i + 1];

            if min_seen_y == None || cur_y < min_seen_y.unwrap() {
                min_seen_y = Some(cur_y);
            }

            if max_seen_y == None || cur_y > max_seen_y.unwrap() {
                max_seen_y = Some(cur_y);
            }

            i += 1;
        }

        let mut cur_null_mask : u8 = 0;

        match min_seen_y {
            Some(value) => min_y_values[pixel_x] = value_space_to_render_space(value, min_y, max_y, log_scale, render_height),
            None => cur_null_mask |= 0b010
        }

        match max_seen_y {
            Some(value) => max_y_values[pixel_x] = value_space_to_render_space(value, min_y, max_y, log_scale, render_height),
            None => cur_null_mask |= 0b100
        }

        // pass any discontinuities along
        if (i + 1) >= length || (data_null_mask[i] > 0) || (data_null_mask[i + 1] > 0) {
            if (i + 1) >= length || data_null_mask[i] > 0 {
                cur_null_mask |= 0b001; // mark y as null
            } else {
                let y = data[2*i + 1];
                y_values[pixel_x] = value_space_to_render_space(y, min_y, max_y, log_scale, render_height);
            }

            i += 1;

            null_mask[pixel_x] = cur_null_mask;
            continue;
        }

        // interpolate
        let x_before = data[2*i];
        let y_before = data[2*i + 1];

        let x_after = data[2*(i + 1)];
        let y_after = data[2*(i + 1) + 1];

        let percent = (x - x_before) / (x_after - x_before);
        let mut y = percent * (y_after - y_before) + y_before;

        // we're at the first point after the direction changed. Don't interpolate
        if prev_i != (i as i32) {
            y = y_before;
        }

        y_values[pixel_x] = value_space_to_render_space(y, min_y, max_y, log_scale, render_height);
        null_mask[pixel_x] = cur_null_mask;

        prev_i = i as i32;
    }
}
