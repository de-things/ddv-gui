import fs from "fs";
import crypto from "crypto";

var config;

export var public_dir = () => "./public";
export var port = () => config.port;
export var db_path = () => config.db_path;
export var secret = () => config.secret;
export var request_max_bytes = () => config.request_max_bytes;

export var credentials = () => {
    return {
        key: fs.readFileSync(config.key_path),
        cert: fs.readFileSync(config.crt_path),
    }
}

const CONFIG_DEFAULTS = {
    port: 1984,
    db_path: "",
    request_max_bytes: 102400,
    secret: crypto.randomBytes(16).toString("hex"),
    key_path: "./cert/server.key",
    crt_path: "./cert/server.crt"
}

/** initializes config data */
export function init() {
    console.log("Validating config data...");
    
    // create config.json if does not exist
    if (!fs.existsSync("config.json")) {
        fs.writeFileSync("config.json", JSON.stringify(CONFIG_DEFAULTS, null, 2));
        console.log("Created './config.json'. Please specify data base path in 'db_path', before running server again.");
        process.exit();
    }

    config = JSON.parse(fs.readFileSync("config.json", { encoding: "utf-8" }));

    if (Object.keys(CONFIG_DEFAULTS).filter(key => !Object.keys(config).includes(key)).length > 0) {
        console.log("'./config.json' content is invalid. Please delete 'config.json' and restart server to recreate it.");
        process.exit(1);
    }
    
    if (config.db_path == "") {
        console.error("You need to specify 'db_path' in './config.json' to start a server.")
        process.exit(1);
    }
    
    if (!fs.existsSync(config.db_path)) {
        fs.mkdirSync(config.db_path);
        console.log(`Created database path: ${config.db_path}`);
    }
    
    console.log(`Current database path: ${config.db_path}`);
}

export default {}