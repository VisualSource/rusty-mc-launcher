pub fn add(left: u64, right: u64) -> u64 {
    left + right
}
/*const REPLACEMENT_KEYS: [&str; 23] = [
    "user_type",
    "clientid",
    "assets_root",
    "game_directory",
    "natives_directory",
    "assets_index_name",
    "version_type",
    "classpath",
    "version_name",
    "auth_xuid",
    "auth_uuid",
    "auth_access_token",
    "auth_player_name",
    "library_directory",
    "classpath_separator",
    "quickPlayRealms",
    "quickPlayMultiplayer",
    "quickPlaySingleplayer",
    "quickPlayPath",
    "launcher_name",
    "launcher_version",
    "resolution_width",
    "resolution_height",
];*/
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
