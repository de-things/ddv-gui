### Description

This web GUI is designed for routers, so you can install it there via linux container (I use RouterOS on a Mikrotik router).

Important steps to deploy this project in router is to use separate flash drive for a database (cluster) to protect router internal memory from DDOS attacks.

### Install instructions

Server-side is written in `nodejs`. You need to install it first. Then run these commands in terminal inside root directory of the project:

```
sudo npm install --global babel-minify
chmod +x ./start.sh
```

> [!CAUTION]
> Before running server open `config.json` and setup the path to a local database. This path will be used by server to store all ddv layout presets!

After setting up database path in `config.json`, to start server run this in terminal:

```
./start.sh
```

Script should bundle client code and run server on defined arrangements.

### Usage without `npm`

Rename `client.js` to `bundle.js` and move file into `/public` directory by replacing original `bundle.js` file.

Run server as:

```
node server.js
```

In this case you will be able to modify client code without restarting the server every time, but such approach increases production page load time. You still need to define database directory in `config.json` before use.