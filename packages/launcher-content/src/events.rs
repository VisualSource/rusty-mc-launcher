use serde::Serialize;

use crate::models::queue::QueueType;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum DownloadEvent {
    Init {
        profile: String,
        content_type: QueueType,
        icon: Option<String>,
        display_name: String,
    },
    Started {
        max_progress: usize,
        message: String,
    },
    Progress {
        amount: Option<usize>,
        message: Option<String>,
    },
    InvalidateQuery {
        query_key: Vec<String>,
    },
    Toast {
        status: String,
        message: String,
    },
    RefreshProfile,
    Finished,
}
