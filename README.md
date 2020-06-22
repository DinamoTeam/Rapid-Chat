# Rapid-Chat

## Chat rooms using peer to peer (PeerJS)

## **Development setup**

This project uses .NET Core 2.1.1

Download SQLite3
https://sqlite.org/download.html

Install the EF Core SQL Server provider

```shell
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
```
Create/Update the local instance of the DB

```shell
dotnet ef database drop
dotnet ef database update
```
This project was generated with [Angular CLI](https://cli.angular.io/) version 8.3.9.

Install the CLI using NPM ([Node.js](https://nodejs.org/en/) >= 10 required)

```shell
npm install -g @angular/cli@8.3.9 
```
In the client's folder. Restore all NPM packages by running

```shell
npm install
```
Config PeerServer
Edit file rapid-chat-client/node_modules/peer/node_modules/ws/index.js by adding the last 2 lines

```js
'use strict';

const WebSocket = require('./lib/websocket');

WebSocket.createWebSocketStream = require('./lib/stream');
WebSocket.Server = require('./lib/websocket-server');
WebSocket.Receiver = require('./lib/receiver');
WebSocket.Sender = require('./lib/sender');

module.exports = WebSocket;

// ADD THESE 2 LINES
var PeerServer = require('peer').PeerServer;
var server = PeerServer({ port: 9000, path: '/myapp' });
```

Start PeerServer

```shell
node rapid-chat-client/node_modules/peer/node_modules/ws/index.js
### Go to this link to make sure PeerServer run successfully http://127.0.0.1:9000/myapp
```
Start IIS Express server through Visual Studio IDE or run this command in the project's folder
```shell
dotnet run
```
Run this command in the client's folder.

```shell
ng serve --open
```
 Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.
