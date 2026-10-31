## Description

This web GUI is designed to be deployed to routers, but you can pick any other supported platform. For example in Android you can use [termux](https://termux.dev/) to run server in the background and then access GUI layout via browser.

An important step deploying this project into a router is to use distinct memory card (flash drive) for a cluster (database) to protect router's infrastructure from memory overflow.

## Running in debug mode (Linux)
 
First of all you need to install [git](https://git-scm.com/), [nodejs](https://nodejs.org/) and `openssl` cli tool.

The next step is to clone repo using:

```
git clone --recurse-submodules https://github.com/de-things/de-gui.git
```

Go to clonned directory and run:

```sh
chmod +x ./install.sh && ./install.sh
```

After script downloaded dependencies, you need to create debug SSL certificate in order to run this server in debug mode. To do it, run:

```sh
./mkcert.sh 192.168.0.1 # replace with server's public IP
```

Script should create self-signed SSL certificates and allow you to start a server. So to start a server from now and on use:

```sh
./start.sh
```

During first run server will create file called `config.json` and ask you to define `db_path`. This is a route to your local cluster to store users data. Define any path you want and run `./start.sh` again.

After entering a web interface you need to gain server access and fetch cluster data. In order to do so, in web interface go to settings (gear button) and in `Access key` field specify secret value located in `config.json` under `secret` variable. That private key was randomly generated and wanted to be used as an encryption provider for further communication.

After specifying an `Access key` press `Sync` button to apply changes. Web interface should fetch server data and if an `Access key` was fine server will respond with presets data.

If `Access key` is invalid, presets tab show `Access denied` message, otherwise you may see presets list with a `+` button. It will be empty if you're on clean install though.

From now and on you can start working on GUI presets by pressing a `+` button.

## About GUI presets

Each preset can be modified by holding it.

Each tile in preset can be modified by holding it as well. Inproper values in tile fields will drop tip messages into GUI logs.

## SSL certificate

Since this project relies on encrypted client<>server communication, HTTPS is **required**.

By default server uses `server.*` key/crt pair, but if you plan to deploy this project into your environment you need to worry about getting your own **trusted** SSL certificate. For such problem I can recommend you to buy a domain and then reverse-proxy traffic to it. `nginx` or `caddy` may help with it. You can check more info over the internet.

If you are poor (like me) you can use install self-signed certificate to *trust* server IP on specified devices.

### So, you are poor (Android example)

Since default `server.*` certificate was self-signed during `./install.sh` you need to manually *trust* (install) it on device you want to use as an entry point to a web interface.

On Android device go to: Settings -> Security & Privacy -> More -> Encryption & credentials -> Install a certificate...

In project's `/cert` directory you can find `trusted.crt` file which is the one you need to install on your device. If you don't see `/cert` directory - run `./install.sh` again and check terminal output for issues.

After `trusted.crt` was installed it's time to test it.

If you use Chrome browser it should automatically update trusted certificates right after you install them.

For Firefox browser there are additional steps...

In Firefox browser go to: Settings -> About Firefox -> Tap Firefox logo until developer menu will be unlocked -> Go back and open `Secret Settings` -> Enable check `Use third party CA certificates`.

Go to server URL and no SSL issues should be listed.

Keep in mind installed certificate may cause some apps stop working on your device, since it violates android security concepts. So to return workflow you can uninstall certificate by clicking on the same tab you installed it: `Trusted/User credentials` -> `Uninstall`.

### Important finale

If your server IP change for some reason, your trusted certificate will turn into a pumpkin. To avoid such inconvenience - **make your server IP static**.

That's all about SSL.

## Deploying to prefered environment

In order to deploy this web-interface in router you need to build it.

First of all, check router's architecture and container's OS you plan to run this project. For example, my MikroTik router run on ARM64 and use Alpine Linux as a container environment.

So in order to build this project for my router's setup we will:

1. Find any computer with the same architecture as my router (Android smartphone is enough, since aarch64 == arm64);
2. Run project in debug mode at least once following the guide above;
3. Run `./build.sh` to generate output files to be deployed in router;
4. Clone these files in router and run `./server` there.

## Overview

<img src=./misc/overview.png>