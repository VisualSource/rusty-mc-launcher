use crate::error::Error;
use serde::{Deserialize, Deserializer, Serializer};

/// A maven name that in in the form of "groupId:artifactId:version"
#[derive(Debug, Clone)]
pub struct MavenRepository {
    package: String,
    name: String,
    version: String,
    /// the name of the file that this maven name points to.
    /// Ex. "org.lwjgl:lwjgl:3.3.3" -> "lwjgl-3.3.3.jar"
    file: String,
    native: Option<String>,
}

impl MavenRepository {
    /// parse a maven name into a struct
    pub fn parse(buf: &str) -> Result<MavenRepository, Error> {
        let name_items = buf.split(':').collect::<Vec<&str>>();

        let package = name_items.first().ok_or_else(|| {
            Error::InvalidMavenPackage(format!("failed to parse out package name from '{}'", buf))
        })?;
        let name = name_items.get(1).ok_or_else(|| {
            Error::InvalidMavenPackage(format!("failed to parse out name from '{}'", buf))
        })?;

        if name_items.len() == 3 {
            let version_ext = name_items
                .get(2)
                .ok_or_else(|| {
                    Error::InvalidMavenPackage(format!(
                        "failed to parse out version from '{}'",
                        buf
                    ))
                })?
                .split('@')
                .collect::<Vec<&str>>();
            let version = version_ext.first().ok_or_else(|| {
                Error::InvalidMavenPackage(format!(
                    "failed to parse out version ext from '{}'",
                    buf
                ))
            })?;
            let ext = version_ext.get(1);

            Ok(MavenRepository {
                package: package.to_string(),
                name: name.to_string(),
                version: version.to_string(),
                file: format!("{}-{}.{}", name, version, ext.unwrap_or(&"jar")),
                native: None,
            })
        } else {
            let version = name_items.get(2).ok_or_else(|| {
                Error::InvalidMavenPackage(format!("failed to parse version from '{}'", buf))
            })?;

            let data_ext = name_items
                .get(3)
                .ok_or_else(|| {
                    Error::InvalidMavenPackage(format!("failed to parse data from '{}'", buf))
                })?
                .split('@')
                .collect::<Vec<&str>>();
            let data = data_ext.first().ok_or_else(|| {
                Error::InvalidMavenPackage(format!("failed to parse native from '{}'", buf))
            })?;
            let ext = data_ext.get(1);

            Ok(Self {
                package: package.to_string(),
                name: name.to_string(),
                version: version.to_string(),
                file: format!("{}-{}-{}.{}", name, version, data, ext.unwrap_or(&"jar")),
                native: Some(data.to_string()),
            })
        }
    }

    /// get file system path of the file
    pub fn as_classpath(&self) -> String {
        format!(
            "{}/{}/{}/{}",
            self.package.replace('.', "/"),
            self.name,
            self.version,
            self.file
        )
    }

    pub fn version(&self) -> &str {
        &self.version
    }

    pub fn package(&self) -> String {
        if let Some(native) = &self.native {
            format!("{}:{}:{}", self.package, self.name, native)
        } else {
            format!("{}:{}", self.package, self.name)
        }
    }

    /// serde deserialize a string into maven name struct
    /// <https://brokenco.de/2020/08/03/serde-deserialize-with-string.html>
    pub fn deserialize<'de, D>(deserializer: D) -> Result<MavenRepository, D::Error>
    where
        D: Deserializer<'de>,
    {
        let buf = String::deserialize(deserializer)?;

        Self::parse(&buf).map_err(|x| serde::de::Error::custom(x.to_string()))
    }
    /// serde serialize maven name struct into a string
    pub fn serialize<S>(lib: &MavenRepository, serialize: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serialize.serialize_str(&lib.to_string())
    }
}

impl std::fmt::Display for MavenRepository {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if let Some(native) = &self.native {
            f.write_fmt(format_args!(
                "{}:{}:{}:{}",
                self.package, self.name, self.version, native
            ))?;
        } else {
            f.write_fmt(format_args!(
                "{}:{}:{}",
                self.package, self.name, self.version
            ))?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_maven_name() {
        let maven = MavenRepository::parse("com.google.guava:failureaccess:1.0.1")
            .expect("Failed to parse");

        assert_eq!(maven.package, "com.google.guava");
        assert_eq!(maven.name, "failureaccess");
        assert_eq!(maven.version, "1.0.1");
        assert_eq!(maven.file, "failureaccess-1.0.1.jar");
        assert!(maven.native.is_none());
    }

    #[test]
    fn test_parse_maven_name_with_file() {
        let maven = MavenRepository::parse("com.google.guava:failureaccess:1.0.1@exe")
            .expect("Failed to parse");

        assert_eq!(maven.package, "com.google.guava");
        assert_eq!(maven.name, "failureaccess");
        assert_eq!(maven.version, "1.0.1");
        assert_eq!(maven.file, "failureaccess-1.0.1.exe");
        assert!(maven.native.is_none());
    }

    #[test]
    fn test_parse_maven_name_with_native() {
        let maven = MavenRepository::parse("org.lwjgl:lwjgl:3.3.3:natives-windows-x86")
            .expect("Failed to parse");

        assert_eq!(maven.package, "org.lwjgl");
        assert_eq!(maven.name, "lwjgl");
        assert_eq!(maven.version, "3.3.3");
        assert_eq!(maven.file, "lwjgl-3.3.3-natives-windows-x86.jar");
        assert_eq!(maven.native, Some("natives-windows-x86".to_string()));
    }

    #[test]
    fn test_bad_maven_name() {
        let maven = MavenRepository::parse("");

        assert!(maven.is_err());
    }

    #[test]
    fn test_bad_maven_name2() {
        let maven = MavenRepository::parse("org.lwjgl");

        assert!(maven.is_err());
    }

    #[test]
    fn test_maven_to_string() {
        let maven = MavenRepository {
            package: "org.lwjgl".into(),
            name: "lwjgl".into(),
            version: "3.3.3".into(),
            file: "lwjgl-3.3.3.jar".into(),
            native: None,
        };

        assert_eq!(maven.to_string(), "org.lwjgl:lwjgl:3.3.3".to_string());
    }

    #[test]
    fn test_maven_to_string_with_native() {
        let maven = MavenRepository {
            package: "org.lwjgl".into(),
            name: "lwjgl".into(),
            version: "3.3.3".into(),
            file: "lwjgl-3.3.3.jar".into(),
            native: Some("natives-windows-x86".into()),
        };

        assert_eq!(
            maven.to_string(),
            "org.lwjgl:lwjgl:3.3.3:natives-windows-x86".to_string()
        );
    }

    #[test]
    fn test_maven_as_classpath() {
        let maven = MavenRepository {
            package: "org.lwjgl".into(),
            name: "lwjgl".into(),
            version: "3.3.3".into(),
            file: "lwjgl-3.3.3.jar".into(),
            native: None,
        };

        assert_eq!(
            maven.as_classpath(),
            "org/lwjgl/lwjgl/3.3.3/lwjgl-3.3.3.jar".to_string()
        );
    }
}
