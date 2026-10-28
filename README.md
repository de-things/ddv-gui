## Description

This web GUI is designed to be deployed to routers, but you can pick any other supported platform. For example in android you can use [termux](https://termux.dev/) to run server in the background and then access GUI layout via `localhost:port` URL in browser.

An important step deploying this project into the router is to use distinct memory card (flash drive) for a database (cluster) to protect router's infrastructure from memory overflow.

## Install

Server-side is written in [nodejs](https://nodejs.org/). You need to install it first.

After install run server by a following command:

```sh
node server.js
```

Server will create file called `config.json` where you need to specify `db_path` variable. After setting it up run the same command again:

```sh
node server.js
```

Now server is listening on port specified in config and using `db_path` as a cluster directory.

You can enter web interface locally using address from terminal logs. For default configuration it should be:

```sh
https://localhost:1984
```

After entering a web interface you need to gain server access and fetch cluster data. To do so, you need to open web interface settings (gear button) and in `Private key` field specify server secret located in `config.json` under `secret` variable. This private key was randomly generated upon file creation.

After specifying a private key click (tap) "Sync" button to confirm changes. Web interface should fetch server data and if valid private key was specified server will respond with it's presets data.

If private key is invalid, presets tab will show "Access denied" message.

From now and on you can start working on GUI presets in web interface by clicking on '+' button.

## SSL certificate

Since this project relies on encrypted client<>server communication, HTTPS is **required**.

By default server uses *debug-* key/cert pair, but if you plan to deploy this project into your environment you need to worry about generating your own certificates for security reasons. You can use `openssl` cli tool to generate appropriate files.

You can specify path to certificate files in `config.json` under `key_path` and `cert_path` variables.

## About presets

Presets are basically a pre-built layout for web interface with buttons (tiles) to control de:things devices. They stored on server-side and can be fetched/modified at any time.

Each tile in preset can be modified by holding it, so follow in-app instructions to setup it properly.

## Contribute

### Linux

Run these commands before start editing a code:

```sh
sudo npm install --global esbuild
chmod +x ./rebuild.sh
```

From now and on to rebuild the project, use:

```sh
./rebuild.sh
```

A script should re-bundle client's code and start a server with related `config.json` attributes.

You need to run `./rebuild.sh` every time you modify javascript code. There is no live-update feature.

### Windows

For Windows users procedure mostly the same, some commands just different.

Install dependencies:

```sh
npm install --global esbuild
```

In powershell run each time after editing a javascript code:

```sh
./rebuild.ps1
```