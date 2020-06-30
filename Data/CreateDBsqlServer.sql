CREATE TABLE rooms (
	RoomName VARCHAR(128) PRIMARY KEY
);

CREATE TABLE peers (
	PeerId VARCHAR(128) PRIMARY KEY,
	RoomName VARCHAR(128) NOT NULL,
	FOREIGN KEY (RoomName) REFERENCES rooms(RoomName)
);

-- To scaffold: Run this command in Package Manager Console
-- Scaffold-DbContext "DataSource=C:\dev\mydatabase.sqlite3" Microsoft.EntityFrameworkCore.Sqlite 