## Description

This web GUI is designed to be deployed to routers, but you can pick any other supported platform. For example in Android you can use [termux](https://termux.dev/) to run server in the background and then access GUI layout via browser.

## Running in debug mode (Linux/Android)
 
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

## Deploying to prefered environment (Router example)

The best way to deploy is to build the project into a standalone executable. I'll describe steps for deploying it into a router.

First of all, check router's architecture and container's OS you plan to run this project on. For example, my MikroTik router operate on ARM64 architecture with Alpine Linux as a container environment.

So in order to build this project for such router you need to find some *computer* with a described setup and then run this project there in debug mode following steps above.

After successful run and setting things up, you can build the project on *computer* using:

```sh
./build.sh
```

This script bundle javascript into a standalone executable file and clone everything server need to work with into a destination folder.

For setup above build files will be located in `bin/arm64`of project's root directory. All you need to do after is to clone this `bin/arm64` files to the router and run an executable inside:

```sh
./server
```

It should work the same way as in dev environment you run it using `./start.sh` script.

In a case of using built version of the project, you don't need `nodejs` or other tools being installed on router (or any other device) in this case.

## Overview

<img src=./misc/overview.png>