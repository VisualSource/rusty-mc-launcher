use minecraft_launcher_lib::client::Client;
use tokio::sync::Mutex;
pub struct TauriState(pub Mutex<Client>);
