use time::format_description::well_known::Iso8601;

const BYTE: u64 = 1;
const KILOBYTE: u64 = 1024 * BYTE;
const MEGABYTE: u64 = 1024 * KILOBYTE;
const GIGABYTE: u64 = 1024 * MEGABYTE;

/// Creates a Iso8601 timestamp
pub fn current_timestamp() -> Result<String, time::error::Format> {
    let now = std::time::SystemTime::now();
    let offset: time::OffsetDateTime = now.into();

    offset.format(&Iso8601::DATE_TIME)
}

/// Get the systems total memory in GB
pub fn get_ram_gb() -> u64 {
    let info = sysinfo::System::new_all();
    (info.total_memory() as f64 / GIGABYTE as f64).round() as u64
}

#[cfg(test)]
mod tests {
    use super::get_ram_gb;

    #[test]
    fn test_get_ram_gb() {
        let value = get_ram_gb();

        println!("{}", value);
    }
}
