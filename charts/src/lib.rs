use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello {} from Rust WASM!", name)
}

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[wasm_bindgen]
pub struct SimpleCanvas {
    width: u32,
    height: u32,
}

#[wasm_bindgen]
impl SimpleCanvas {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32) -> SimpleCanvas {
        SimpleCanvas { width, height }
    }
    
    pub fn get_size(&self) -> String {
        format!("Canvas size: {}x{}", self.width, self.height)
    }
}