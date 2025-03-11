use wasm_bindgen::prelude::*;
mod selected_space_to_render_space;
mod extract_vertices;
mod get_point_number;

// This is like the `main` function, except for JavaScript.
#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    #[cfg(debug_assertions)]
        console_error_panic_hook::set_once();

    Ok(())
}
