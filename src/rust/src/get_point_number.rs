use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn get_point_number(null_mask: &[u8], y_values: &[f64], min_y_values: &[f64], max_y_values: &[f64], dashed : bool, dash0 : usize, dash1 : usize) -> f64 {
    let mut previously_discontinuous = true;

    let mut point_i = 0;
    let mut path_i = 0;

    for i in 0..y_values.len() {
        if dashed && path_i % (dash0 + dash1) >= dash0 {
            path_i += 1;
            continue;
        }

        if (null_mask[i] & 0b001) > 0 { // y null
            previously_discontinuous = true;
            continue;
        }

        if previously_discontinuous {
            path_i = 0;
        }

        point_i += 1;
        path_i += 1;

        let min_y = min_y_values[i];
        let max_y = max_y_values[i];

        if min_y != max_y {
            if (null_mask[i] & 0b010) == 0 {
                point_i += 1;
                path_i += 1;
            }

            if (null_mask[i] & 0b110) == 0 {
                point_i += 1;
                path_i += 1;
            }

            point_i += 1;
            path_i += 1;
        }

        previously_discontinuous = false;
    }

    point_i as f64
}