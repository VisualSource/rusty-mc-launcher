-- Add migration script here
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, metadata TEXT, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS processes (uuid TEXT PRIMARY KEY NOT NULL, pid INTEGER NOT NULL, name TEXT NOT NULL, exe TEXT NOT NULL, profile_id TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, icon TEXT, date_created DATETIME NOT NULL, last_played DATETIME, version TEXT NOT NULL, loader TEXT NOT NULL, loader_version TEXT, java_args TEXT, resolution_width TEXT, resolution_height TEXT);