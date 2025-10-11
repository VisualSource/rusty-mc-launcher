use serde::{Deserialize, Serialize};

pub trait Hasher {
    fn update(&mut self, buffer: &[u8]);
    fn finish(self) -> String;
}

pub trait Hashable: std::cmp::PartialEq<std::string::String> + std::fmt::Display {
    fn get_hasher(&self) -> impl Hasher;
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct Sha1(String);

impl Sha1 {
    pub fn new(value: String) -> Self {
        Self(value)
    }
}

impl Hashable for Sha1 {
    fn get_hasher(&self) -> impl Hasher {
        Sha1Hasher::default()
    }
}

impl std::fmt::Display for Sha1 {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::cmp::PartialEq<std::string::String> for Sha1 {
    fn eq(&self, other: &std::string::String) -> bool {
        &self.0 == other
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct Sha2(String);

impl Hashable for Sha2 {
    fn get_hasher(&self) -> impl Hasher {
        Sha2Hasher::default()
    }
}

impl std::fmt::Display for Sha2 {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::cmp::PartialEq<std::string::String> for Sha2 {
    fn eq(&self, other: &std::string::String) -> bool {
        &self.0 == other
    }
}

#[derive(Debug, Default)]
pub struct Sha1Hasher(sha1::Sha1);

impl Hasher for Sha1Hasher {
    fn update(&mut self, buffer: &[u8]) {
        use sha1::Digest;

        self.0.update(buffer);
    }

    fn finish(self) -> String {
        use sha1::Digest;
        hex::encode(self.0.finalize())
    }
}

#[derive(Debug, Default)]
pub struct Sha2Hasher(sha2::Sha512_256);

impl Hasher for Sha2Hasher {
    fn update(&mut self, buffer: &[u8]) {
        use sha2::Digest;
        self.0.update(buffer);
    }

    fn finish(self) -> String {
        use sha1::Digest;
        hex::encode(self.0.finalize())
    }
}
