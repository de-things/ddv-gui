### Description

This web GUI is designed for routers, so you can install it there via linux container (I use RouterOS on a Mikrotik router).

Important steps to deploy this project in router is to use separate flash drive for a database (cluster) to protect router internal memory from DDOS attacks.

### Install instructions

Server-side is written in `nodejs`. You need to install it first. Then run these commands in terminal inside root directory of the project:

```
sudo npm install --global babel-minify
chmod +x ./rebuild.sh
```

> [!CAUTION]
> Before running server open `config.json` and setup the path to a local database. This path will be used by server to store all ddv layout presets!

After setting up a database path in `config.json` start the server by running in terminal:

```
./rebuild.sh
```

Script should bundle client code and run server on defined arrangements.

### Usage without `npm` deps

If you do not plan to modify code base - run in project's root directory:

```
node server.js
```

**You still need to define database directory in `config.json` before running the server!**