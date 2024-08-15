use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum DownloadEvent {
    Started {
        max_progress: usize,
        message: String,
    },
    Progress {
        amount: Option<usize>,
        message: Option<String>,
    },
    Finished {},
}
