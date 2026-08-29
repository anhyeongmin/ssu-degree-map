use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn rusaint_parser_stack_probe() -> bool {
    std::mem::size_of::<wdpe::body::Body>() > 0
        && std::mem::size_of::<ozra::types::DataSet>() > 0
}
