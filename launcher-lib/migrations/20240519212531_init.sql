CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL, 
    metadata TEXT, 
    value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS processes (
    uuid TEXT PRIMARY KEY NOT NULL, 
    pid INTEGER NOT NULL, 
    name TEXT NOT NULL, 
    exe TEXT NOT NULL, 
    profile_id TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY NOT NULL, 
    name TEXT NOT NULL, 
    icon TEXT, 
    date_created DATETIME NOT NULL, 
    last_played DATETIME, 
    version TEXT NOT NULL, 
    loader TEXT NOT NULL, 
    loader_version TEXT, 
    java_args TEXT, 
    resolution_width TEXT, 
    resolution_height TEXT,
    state TEXT NOT NULL DEFAULT 'UNINSTALLED'
);
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    profile TEXT NOT NULL, 
    category TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS download_queue (
    id TEXT PRIMARY KEY NOT NULL,
    display BOOLEAN DEFAULT TRUE NOT NULL,
    install_order INTEGER NOT NULL,
    display_name TEXT NOT NULL,
    icon TEXT,
    profile_id TEXT NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    content_type TEXT NOT NULL,
    metadata TEXT,
    state TEXT DEFAULT 'PENDING' NOT NULL
);
INSERT INTO settings VALUES (
"category.aa0470a6-89e9-4404-a71c-008ee2025e72",
"aa0470a6-89e9-4404-a71c-008ee2025e72",
"Favorites"),
("category.40b8bf8c-5768-4c0d-82ba-8c00bb181cd8",
"40b8bf8c-5768-4c0d-82ba-8c00bb181cd8",
"Uncategorized");