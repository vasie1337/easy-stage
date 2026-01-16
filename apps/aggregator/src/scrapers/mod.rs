pub mod nvb;
pub mod stagemarkt;

use serde_json::Value;

pub fn get_string(v: &Value, path: &[&str]) -> Option<String> {
    let mut cur = v;
    for key in path {
        cur = cur.get(*key)?;
    }
    match cur {
        Value::String(s) => Some(s.clone()),
        Value::Number(n) => Some(n.to_string()),
        Value::Bool(b) => Some(b.to_string()),
        _ => None,
    }
}

pub fn get_i32(v: &Value, path: &[&str]) -> Option<i32> {
    let mut cur = v;
    for key in path {
        cur = cur.get(*key)?;
    }
    match cur {
        Value::Number(n) => n.as_i64().map(|v| v as i32),
        Value::String(s) => s.parse::<i32>().ok(),
        _ => None,
    }
}

pub fn get_f64(v: &Value, path: &[&str]) -> Option<f64> {
    let mut cur = v;
    for key in path {
        cur = cur.get(*key)?;
    }
    match cur {
        Value::Number(n) => n.as_f64(),
        Value::String(s) => s.parse::<f64>().ok(),
        _ => None,
    }
}

pub fn empty_object() -> Value {
    Value::Object(serde_json::Map::new())
}

pub fn empty_array() -> Value {
    Value::Array(Vec::new())
}

pub fn join_location(parts: Vec<Option<String>>) -> Option<String> {
    let mut out = Vec::new();
    for part in parts.into_iter().flatten() {
        let p = part.trim().to_string();
        if !p.is_empty() {
            out.push(p);
        }
    }
    if out.is_empty() {
        None
    } else {
        Some(out.join(", "))
    }
}
