use js_sys::Array;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct FinancialChart {
    width: f64,
    height: f64,
    data: Vec<DataPoint>,
    scale_y: f64,
    offset_y: f64,
    pan_offset_x: f64,
    pan_offset_y: f64,
}

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct DataPoint {
    pub timestamp: f64,
    pub price: f64,
    pub volume: f64,
}

#[wasm_bindgen]
impl DataPoint {
    #[wasm_bindgen(constructor)]
    pub fn new(timestamp: f64, price: f64, volume: f64) -> DataPoint {
        DataPoint {
            timestamp,
            price,
            volume,
        }
    }
}

#[wasm_bindgen]
impl FinancialChart {
    #[wasm_bindgen(constructor)]
    pub fn new(width: f64, height: f64) -> FinancialChart {
        FinancialChart {
            width,
            height,
            data: Vec::new(),
            scale_y: 1.0,
            offset_y: 0.0,
            pan_offset_x: 0.0,
            pan_offset_y: 0.0,
        }
    }

    #[wasm_bindgen]
    pub fn add_data(&mut self, timestamp: f64, price: f64, volume: f64) {
        self.data.push(DataPoint {
            timestamp,
            price,
            volume,
        });
    }

    #[wasm_bindgen]
    pub fn add_data_batch(&mut self, data_points: JsValue) -> Result<(), JsValue> {
        if let Ok(array) = data_points.dyn_into::<Array>() {
            for i in 0..array.length() {
                if let Ok(obj) = array.get(i).dyn_into::<js_sys::Object>() {
                    let timestamp = js_sys::Reflect::get(&obj, &"timestamp".into())
                        .unwrap_or(0.0.into())
                        .as_f64()
                        .unwrap_or(0.0);
                    let price = js_sys::Reflect::get(&obj, &"price".into())
                        .unwrap_or(0.0.into())
                        .as_f64()
                        .unwrap_or(0.0);
                    let volume = js_sys::Reflect::get(&obj, &"volume".into())
                        .unwrap_or(0.0.into())
                        .as_f64()
                        .unwrap_or(0.0);
                    self.data.push(DataPoint {
                        timestamp,
                        price,
                        volume,
                    });
                }
            }
            Ok(())
        } else {
            Err(JsValue::from_str("Invalid data format"))
        }
    }

    #[wasm_bindgen]
    pub fn get_line_points(&self) -> JsValue {
        let points = Array::new();
        if self.data.len() < 2 {
            return points.into();
        }
        let mut sorted_data = self.data.clone();
        sorted_data.sort_by(|a, b| a.timestamp.partial_cmp(&b.timestamp).unwrap());
        let (min_price, max_price) = self.get_price_range();
        let price_range = (max_price - min_price).max(0.01);
        for point in sorted_data {
            let x = self.time_to_x(point.timestamp);
            let y = self.price_to_y(point.price, min_price, price_range);
            let point_obj = js_sys::Object::new();
            js_sys::Reflect::set(&point_obj, &"x".into(), &x.into()).unwrap();
            js_sys::Reflect::set(&point_obj, &"y".into(), &y.into()).unwrap();
            js_sys::Reflect::set(&point_obj, &"price".into(), &point.price.into()).unwrap();
            points.push(&point_obj);
        }
        points.into()
    }

    #[wasm_bindgen]
    pub fn get_price_grid(&self) -> JsValue {
        let grid = Array::new();
        let (min_price, max_price) = self.get_price_range();
        let price_range = (max_price - min_price).max(0.01);
        for i in 0..=10 {
            let price = min_price + price_range * (i as f64) / 10.0;
            let y = self.price_to_y(price, min_price, price_range);
            let line_obj = js_sys::Object::new();
            js_sys::Reflect::set(&line_obj, &"y".into(), &y.into()).unwrap();
            js_sys::Reflect::set(&line_obj, &"price".into(), &price.into()).unwrap();
            js_sys::Reflect::set(&line_obj, &"is_major".into(), &(i % 5 == 0).into()).unwrap();
            grid.push(&line_obj);
        }
        grid.into()
    }

    #[wasm_bindgen]
    pub fn get_time_grid(&self) -> JsValue {
        let grid = Array::new();
        if self.data.len() < 2 {
            return grid.into();
        }
        let (min_time, max_time) = self.get_time_range();
        let time_range = (max_time - min_time).max(1.0);
        for i in 0..=10 {
            let time = min_time + time_range * (i as f64) / 10.0;
            let x = self.time_to_x(time);
            let line_obj = js_sys::Object::new();
            js_sys::Reflect::set(&line_obj, &"x".into(), &x.into()).unwrap();
            js_sys::Reflect::set(&line_obj, &"is_major".into(), &(i % 5 == 0).into()).unwrap();
            let date = js_sys::Date::new(&JsValue::from_f64(time));
            let time_str = format!("{}/{}", date.get_month() + 1, date.get_date());
            js_sys::Reflect::set(&line_obj, &"time".into(), &time_str.into()).unwrap();
            grid.push(&line_obj);
        }
        grid.into()
    }

    #[wasm_bindgen]
    pub fn get_volume_bars(&self) -> JsValue {
        let bars = Array::new();
        if self.data.is_empty() {
            return bars.into();
        }
        let max_volume = self.data.iter().map(|p| p.volume).fold(0.0, f64::max);
        if max_volume == 0.0 {
            return bars.into();
        }
        let (min_time, max_time) = self.get_time_range();
        let mut sorted_data = self.data.clone();
        sorted_data.sort_by(|a, b| a.timestamp.partial_cmp(&b.timestamp).unwrap());
        for (i, point) in sorted_data.iter().enumerate() {
            let x = self.time_to_x(point.timestamp);
            let bar_height = (point.volume / max_volume) * 100.0;
            let y = self.height - bar_height;
            let bar_obj = js_sys::Object::new();
            js_sys::Reflect::set(&bar_obj, &"x".into(), &(x - 1.5).into()).unwrap();
            js_sys::Reflect::set(&bar_obj, &"y".into(), &y.into()).unwrap();
            js_sys::Reflect::set(&bar_obj, &"width".into(), &3.0.into()).unwrap();
            js_sys::Reflect::set(&bar_obj, &"height".into(), &bar_height.into()).unwrap();
            let color = if i == 0 || point.price >= sorted_data[i - 1].price {
                "rgba(33, 150, 243, 0.5)"
            } else {
                "rgba(244, 67, 54, 0.5)"
            };
            js_sys::Reflect::set(&bar_obj, &"color".into(), &color.into()).unwrap();
            bars.push(&bar_obj);
        }
        bars.into()
    }

    #[wasm_bindgen]
    pub fn zoom(&mut self, delta: f64, mouse_y: f64) {
        let zoom_factor = if delta > 0.0 { 0.9 } else { 1.1 };
        let old_scale_y = self.scale_y;
        self.scale_y = (self.scale_y * zoom_factor).max(0.5).min(10.0);
        if old_scale_y != self.scale_y {
            let normalized_y = mouse_y / self.height;
            self.offset_y += (self.scale_y - old_scale_y) * normalized_y * 100.0;
        }
    }

    #[wasm_bindgen]
    pub fn pan(&mut self, dx: f64, dy: f64) {
        self.pan_offset_x += dx;
        self.pan_offset_y += dy;
    }

    #[wasm_bindgen]
    pub fn reset_view(&mut self) {
        self.scale_y = 1.0;
        self.offset_y = 0.0;
        self.pan_offset_x = 0.0;
        self.pan_offset_y = 0.0;
    }

    fn get_time_range(&self) -> (f64, f64) {
        if self.data.is_empty() {
            return (0.0, self.width);
        }
        let mut min = f64::MAX;
        let mut max = f64::MIN;
        for point in &self.data {
            if point.timestamp < min {
                min = point.timestamp;
            }
            if point.timestamp > max {
                max = point.timestamp;
            }
        }
        (min, max)
    }

    fn get_price_range(&self) -> (f64, f64) {
        if self.data.is_empty() {
            return (0.0, 100.0);
        }
        let mut min = f64::MAX;
        let mut max = f64::MIN;
        for point in &self.data {
            if point.price < min {
                min = point.price;
            }
            if point.price > max {
                max = point.price;
            }
        }
        let price_range = (max - min).max(0.01);
        let scaled_range = price_range * self.scale_y;
        let center_price = (min + max) / 2.0 + self.offset_y;
        (
            center_price - scaled_range / 2.0,
            center_price + scaled_range / 2.0,
        )
    }

    fn time_to_x(&self, timestamp: f64) -> f64 {
        if self.data.len() < 2 {
            return self.width / 2.0;
        }

        let (min_time, max_time) = self.get_time_range();
        let time_range = (max_time - min_time).max(1.0);

        let normalized = (timestamp - min_time) / time_range;
        let x = normalized * (self.width - 40.0) + 20.0 + self.pan_offset_x; 

        x.max(20.0).min(self.width - 20.0)
    }

    fn price_to_y(&self, price: f64, min_price: f64, price_range: f64) -> f64 {
        if price_range <= 0.0 {
            return self.height / 2.0;
        }

        let normalized = (price - min_price) / price_range;
        let y = (1.0 - normalized) * (self.height - 80.0) + 10.0 + self.pan_offset_y; 

        y.max(10.0).min(self.height - 70.0)
    }
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello {} from Rust WASM!", name)
}

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
