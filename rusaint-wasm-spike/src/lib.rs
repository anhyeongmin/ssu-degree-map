use rusaint::USaintSession;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn rusaint_wasm_dependency_probe() -> bool {
    let _session = USaintSession::anonymous();
    true
}
