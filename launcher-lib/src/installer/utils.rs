use serde::{Deserialize, Serialize};
use serde_json::json_internal;
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ChannelMessage {
    pub event: String,
    pub value: String,
}

impl ChannelMessage {
    pub fn new(event: impl Into<String>, value: impl Into<String>) -> Self {
        Self {
            event: event.into(),
            value: value.into(),
        }
    }
}

#[macro_export]
macro_rules! event {
    ($channel:expr, $event:expr, $($json:tt)+) => {
        $crate::installer::utils::event_internal::send_event(
            $channel,
            $event,
            serde_json::json_internal!(@object $($json)+),
        )
        .await;
    };
}

pub mod event_internal {
    use super::ChannelMessage;
    use log::error;

    pub async fn send_event<T>(
        channel: &tokio::sync::mpsc::Sender<ChannelMessage>,
        event: T,
        message: serde_json::Value,
    ) where
        T: Into<String>,
    {
        if let Err(error) = channel
            .send(ChannelMessage::new(event.into(), message.to_string()))
            .await
        {
            error!("{}", error);
        }
    }
}
