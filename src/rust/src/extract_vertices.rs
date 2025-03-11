use wasm_bindgen::prelude::*;

fn add_point(x : f32, y : f32, prev_x : f32, prev_y : f32, point_i : usize, positions: &mut [f32], prev_positions: &mut [f32], vertices: &mut [f32], indices: &mut [u32]) {
    for j in 0..4 {
        positions[point_i * 8 + 2 * j] = x;
        positions[point_i * 8 + 2 * j + 1] = y;
        prev_positions[point_i * 8 + 2 * j] = prev_x;
        prev_positions[point_i * 8 + 2 * j + 1] = prev_y;
        vertices[point_i*4 + j] = j as f32;
    }

    indices[point_i * 6] = (point_i * 4) as u32;
    indices[point_i * 6 + 1] = (point_i * 4 + 1) as u32;
    indices[point_i * 6 + 2] = (point_i * 4 + 3) as u32;

    indices[point_i * 6 + 3] = (point_i * 4) as u32;
    indices[point_i * 6 + 4] = (point_i * 4 + 2) as u32;
    indices[point_i * 6 + 5] = (point_i * 4 + 3) as u32;
}

#[wasm_bindgen]
pub fn extract_vertices(dpi_increase: f64, null_mask: &[u8], y_values: &[f64], min_y_values: &[f64], max_y_values: &[f64], positions: &mut [f32], prev_positions: &mut [f32], vertices: &mut [f32], indices: &mut [u32], dashed : bool, dash0 : usize, dash1 : usize) {
    let mut previously_discontinuous = true;

    let mut point_i = 0;
    let mut path_i = 0;

    let mut prev_x : f32;
    let mut prev_y : f32;

    for i in 0..y_values.len() {
        if dashed && path_i % (dash0 + dash1) >= dash0 {
            path_i += 1;
            continue;
        }

        let x : f32 = (i as f32)*(dpi_increase as f32);
        let y = y_values[i] as f32;

        if (null_mask[i] & 0b001) > 0 { // y null
            previously_discontinuous = true;
            continue;
        }

        if previously_discontinuous {
            path_i = 0;
            prev_x = x - 1.0;
            prev_y = y;
        } else  {
            prev_x = ((i - 1) as f32)*(dpi_increase as f32);
            prev_y = y_values[i - 1] as f32;
        }

        add_point(x, y, prev_x, prev_y, point_i, positions, prev_positions, vertices, indices);
        point_i += 1;
        path_i += 1;

        let min_y = min_y_values[i];
        let max_y = max_y_values[i];

        if min_y != max_y {
            if (null_mask[i] & 0b010) == 0 {
                add_point(x, min_y as f32, prev_x, prev_y, point_i, positions, prev_positions, vertices, indices);
                prev_y = min_y as f32;
                point_i += 1;
                path_i += 1;
            }

            if (null_mask[i] & 0b100) == 0 {
                add_point(x, max_y as f32, prev_x, prev_y, point_i, positions, prev_positions, vertices, indices);
                prev_y = max_y as f32;
                point_i += 1;
                path_i += 1;
            }

            add_point(x, y, prev_x, prev_y, point_i, positions, prev_positions, vertices, indices);
            point_i += 1;
            path_i += 1;
        }

        previously_discontinuous = false;
    }
}
