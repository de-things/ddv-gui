## Description

This web GUI is designed to be deployed in routers, but it can be deployed on any other supported platform. For example in android you can use [termux](https://termux.dev/) to run backend in the background and then access GUI layout via `localhost:port`.

An important step deploying this project into the router is to use distinct flash drive for a database (cluster) to protect router's infrastructure from DDOS attacks.

## Install instructions

Server-side is written in `nodejs`. You need to install it first.

> [!CAUTION]
> Before running a server, open `config.json` and define `db_path` path. This path will be used by a server to store all layout presets!

After setting up a database path in `config.json` start the server by running in terminal:

```
node server.js
```

## Contribute

### If you plan to modify a code base

GUI works on just 2 files:
* `client.js` - client javascript code;
* `server.js` - backend nodejs code.

Modifying both requires rebuild the project, so run this before starting editing a code:

```
sudo npm install --global babel-minify
chmod +x ./rebuild.sh
```

From now and on to rebuild the project, use:

```
./rebuild.sh
```

A script should re-bundle client's code and start a server with related `config.json` attributes.