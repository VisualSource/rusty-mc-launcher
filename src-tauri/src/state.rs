use minecraft_launcher_lib::Client;
use tokio::sync::Mutex;

pub struct TauriState(pub Mutex<Client>);