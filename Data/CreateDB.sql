CREATE TABLE rooms (
	RoomName TEXT PRIMARY KEY
);

CREATE TABLE peers (
	PeerId TEXT PRIMARY KEY,
	RoomName TEXT NOT NULL,
	FOREIGN KEY (RoomName) REFERENCES rooms(RoomName)
);

-- To scaffold: Run this command in Package Manager Console
-- Scaffold-DbContext "DataSource=C:\dev\mydatabase.sqlite3" Microsoft.EntityFrameworkCore.Sqlite 