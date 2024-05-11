#[derive(Debug, Default)]
pub struct State {
    pub is_demo_user: Option<bool>,
    pub is_quick_play_realms: Option<bool>,
    pub is_quick_play_singleplayer: Option<bool>,
    pub is_quick_play_multiplayer: Option<bool>,

    pub has_custom_resolution: Option<bool>,
    pub has_quick_plays_support: Option<bool>,
}

impl State {
    pub fn from_config(config: &std::collections::HashMap<String, String>) -> Self {
        Self {
            is_demo_user: if config.contains_key("demo") {
                Some(true)
            } else {
                None
            },
            has_custom_resolution: if config.contains_key("resolution_height")
                || config.contains_key("resolution_width")
            {
                Some(true)
            } else {
                None
            },
            is_quick_play_realms: if config.contains_key("quickPlayRealms") {
                Some(true)
            } else {
                None
            },
            is_quick_play_multiplayer: if config.contains_key("quickPlayMultiplayer") {
                Some(true)
            } else {
                None
            },
            is_quick_play_singleplayer: if config.contains_key("quickPlaySingleplayer") {
                Some(true)
            } else {
                None
            },
            has_quick_plays_support: if config.contains_key("quickPlaysSupport") {
                Some(true)
            } else {
                None
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::State;

    #[test]
    fn test_option_compare() {
        let mut state = State::default();

        assert_eq!(state.has_custom_resolution, None);

        state.has_custom_resolution = Some(true);

        assert_eq!(state.has_custom_resolution, Some(true))
    }
}
