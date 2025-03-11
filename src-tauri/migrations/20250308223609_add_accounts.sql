CREATE TABLE IF NOT EXISTS accounts (
    homeAccountId TEXT PRIMARY KEY NOT NULL, 
    username TEXT NOT NULL,
    idTokenClaims TEXT,
    name TEXT,
    xuid TEXT,
    id TEXT,
    skins TEXT,
    capes TEXT,
    profileActions TEXT
);
CREATE TABLE IF NOT EXISTS tokens (
    id PRIMARY KEY NOT NULL,
    accessToken TEXT NOT NULL,
    refreshToken TEXT NULL NULL,
    accessTokenExp TEXT
    mcAccessToken TEXT
    mcAccessTokenExp TEXT
);

CREATE TRIGGER IF NOT EXISTS account_delete AFTER DELETE ON accounts
BEGIN
    DELETE FROM tokens WHERE id = OLD.homeAccountId;
END;