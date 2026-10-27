import http from "http"
import fs from "fs"
import path from "path"

const mimeTypes = {
    ".html" : "text/html",
    ".css"  : "text/css",
    ".js"   : "text/javascript",
    ".svg"  : "image/svg+xml",
    ".woff2": "font/woff2",
    ".json" : "application/json",
};

const PUBLIC_DIR = "./public";
let config = JSON.parse(fs.readFileSync("./config.json", { encoding: "utf-8" }));
let db_path = config.db_path;
let port = config.port;
let address = config.address;

console.clear();
console.log("[ddv-gui]");

if (!fs.existsSync(db_path)) {
    fs.mkdirSync(db_path);
    console.log(`Created cluster directory: ${db_path}`);
}

console.log(`Cluster directory: ${db_path}`);

/** Returns true if `id` does not contain special symbols.
 * (Excluding white-space ' ' symbol) */
function validateID(id) {
    if (!id || id.toString() == "") return false;

    let chars = /[`!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/;
    return !chars.test(id);
}

function isIPv6(ip) {
    if (ip == "") return false;

    try {
        const url = new URL(`http://[${ip}]/`);
        return url.hostname.startsWith("[") && url.hostname.endsWith("]");
    } catch {
        return false;
    }
}

function isIPv4(ip) {
    if (ip == "") return false;
    
    const seg = ip.trim().split(".");
    if (seg.length !== 4) return false;

    return seg.every(part =>
        /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255
    );
}

/** Returns true whenever `ip` is valid. */
function validateIP(ip) {
    if (isIPv4(ip)) {
        return 4;
    }

    if (isIPv6(ip)) {
        return 6;
    }

    return false;
}

/** Returns random hex string with a length of 4. */
function genRndStr4() {
    return ((Math.random() + 1) * Date.now()).toString(16).substring(2, 6);
}

const server = http.createServer((req, res) => {
    if (req.method === "POST") {
        if (req.url == "/api") {
            let body = [];
            req.on("data", chunk => body.push(chunk));
            req.on("end", () => {
                let json = JSON.parse(Buffer.concat(body).toString());
                let ip_type = validateIP(json.ip);
                if (!ip_type) {
                    res.writeHead(403, "Forbidden");
                    res.end();
                    return;
                }

                let url = ip_type == 4 ? json.ip : `[${json.ip}]`;

                fetch(`http://${url}/`, { 
                    method:     "POST", 
                    body:       json.enc_cmd,
                    cache:      "no-cache",
                    keepalive:  false,
                    signal:     AbortSignal.timeout(2000)
                }).then(raw => { 
                    raw.text().then(data => {
                        res.setHeader("Content-type" , "text/plain");
                        res.end(data);
                    }); 
                }).catch(e => { 
                    res.writeHead(400, "No DDV response");
                    res.end();
                });
            });
            return;
        }
        if (req.url == "/get_preset_data") {
            let body = [];
            req.on("data", chunk => body.push(chunk));
            req.on("end", () => {
                let json = JSON.parse(Buffer.concat(body).toString());
                if (!validateID(json.chunk_id) || !validateID(json.preset_id)) {
                    res.writeHead(403, "Forbidden"); res.end();
                    return;
                }
                
                fs.readFile(path.join(db_path, json.chunk_id, `${json.preset_id}.json`), { encoding: "utf-8" }, (err, _data) => {
                    if (!err) {
                        res.setHeader("Content-type" , "application/json");
                        res.end(_data);
                    }
                    else {
                        res.writeHead(404, "Not Found");
                        res.end();
                    }
                });
            });
            return;
        }
        if (req.url == "/get_presets") {
            let body = [];
            req.on("data", chunk => body.push(chunk));
            req.on("end", () => {
                let json = JSON.parse(Buffer.concat(body).toString());
                if (!validateID(json.chunk_id)) {
                    res.writeHead(403, "Forbidden"); res.end();
                    return;
                }

                let chunk_path = path.join(db_path, json.chunk_id);

                if (!fs.existsSync(chunk_path)) {
                    fs.mkdirSync(chunk_path);
                }
                
                fs.readdir(chunk_path, (err, _data) => {
                    if (!err) {
                        res.setHeader("Content-type" , "application/json");
                        res.end(JSON.stringify({ data: _data.map(file => file.replace(".json", "")) }));
                    }
                    else {
                        res.writeHead(400, "Something went wrong with the server!");
                    }
                    res.end();
                });
            });
            return;
        }
        if (req.url == "/add_tile") {
            let body = [];
            req.on("data", chunk => body.push(chunk));
            req.on("end", () => {
                let json = JSON.parse(Buffer.concat(body).toString());
                if (!validateID(json.chunk_id) || !validateID(json.preset_id)) {
                    res.writeHead(403, "Forbidden"); res.end();
                    return;
                }

                let file_path = path.join(db_path, json.chunk_id, `${json.preset_id}.json`);
                
                if (fs.existsSync(file_path)) { // check if specified preset exist
                    fs.readFile(file_path, { encoding: "utf-8" }, (err, data) => {
                        // get preset data
                        let json = JSON.parse(data);
                        let tile_data = {
                            title: "NEW BTN",
                            ip: "",
                            cmd: "",
                            secret: "",
                            color: "#444"
                        }

                        // add new tile (button)
                        json.tiles.push(tile_data);

                        // update preset file
                        fs.writeFileSync(file_path, JSON.stringify(json));

                        // respond with a new button data
                        res.writeHead(200, "OK");
                        res.end(JSON.stringify(tile_data));
                    });
                }
            });
            return;
        }
        if (req.url == "/add_preset") {
            let body = [];
            req.on("data", chunk => body.push(chunk));
            req.on("end", () => {
                let json = JSON.parse(Buffer.concat(body).toString());
                if (!validateID(json.chunk_id)) {
                    res.writeHead(403, "Forbidden"); res.end();
                    return;
                }

                let chunk_dir = path.join(db_path, json.chunk_id);

                // make chunk dir if not exist
                if (!fs.existsSync(chunk_dir)) {
                    fs.mkdir(chunk_dir);
                }

                fs.readdir(chunk_dir, (err, files) => {
                    let preset_data = {
                        title: `preset_${genRndStr4()}`
                    }

                    let file_path = path.join(db_path, json.chunk_id, `${preset_data.title}.json`);

                    if (fs.existsSync(file_path)) {
                        // such preset file already exist, so respond with an error
                        res.writeHead(400, "Something went wrong");
                        res.end();
                        return
                    }

                    // write new preset file into specified chunk
                    fs.writeFileSync(file_path, JSON.stringify({ tiles: [] }));

                    // respond with a new preset data
                    res.writeHead(200, "OK");
                    res.end(JSON.stringify(preset_data));
                });
            });
            return;
        }
        if (req.url == "/remove_preset") {
            let body = [];
            req.on("data", chunk => body.push(chunk));
            req.on("end", () => {
                let json = JSON.parse(Buffer.concat(body).toString());
                if (!validateID(json.chunk_id) || !validateID(json.preset_id)) {
                    res.writeHead(403, "Forbidden"); res.end();
                    return;
                }

                fs.rm(path.join(db_path, json.chunk_id, `${json.preset_id}.json`), (err) => {
                    if (!err) {
                        res.writeHead(200, "OK");
                        res.end();
                    }
                    else {
                        res.writeHead(400, "Something went wrong");
                        res.end();
                    }
                });
            });
            return;
        }
        if (req.url == "/update_preset_name") {
            let body = [];
            req.on("data", chunk => body.push(chunk));
            req.on("end", () => {
                let json = JSON.parse(Buffer.concat(body).toString());
                if (!validateID(json.chunk_id) || !validateID(json.data)) {
                    res.writeHead(403, "Forbidden"); res.end();
                    return;
                }

                let old_name = path.join(db_path, json.chunk_id, `${json.preset_id}.json`);
                let new_name = path.join(db_path, json.chunk_id, `${json.data}.json`);

                if (old_name == new_name) {
                    res.writeHead(200, "OK");
                    res.end();
                    return;
                }

                if (fs.existsSync(new_name)) {
                    res.writeHead(403, "Preset with such name is already exist");
                    res.end();
                    return;
                }

                fs.rename(old_name, new_name, (err) => {
                    if (!err) {
                        res.writeHead(200, "OK");
                        res.end();
                    }
                    else {
                        res.writeHead(400, "Something went wrong");
                        res.end();
                    }
                });
            });
            return;
        }
        if (req.url == "/save_preset_data") {
            let body = [];
            req.on("data", chunk => body.push(chunk));
            req.on("end", () => {
                let json = JSON.parse(Buffer.concat(body).toString());
                if (!validateID(json.chunk_id) || !validateID(json.preset_id)) {
                    res.writeHead(403, "Forbidden"); res.end();
                    return;
                }
                fs.writeFile(path.join(db_path, json.chunk_id, `${json.preset_id}.json`), JSON.stringify(json.data), { encoding: "utf-8" }, (err, _data) => {
                    if (!err) {
                        res.writeHead(200, "OK");
                        res.end();
                    }
                    else {
                        res.writeHead(400, "Something went wrong");
                        res.end();
                    }
                });
            });
            return;
        }
    }

    // try to send back a file from public/
    let file_path = req.url == "/" ? "index.html" : req.url;

    file_path = file_path.replaceAll("..", ""); // prevent from breaking file system

    fs.readFile(path.join(PUBLIC_DIR, file_path), (err, data) => {
        if (!err) {
            const offset = file_path.lastIndexOf(".");
            const index = offset == -1 ? "" : file_path.substr(offset);

            const mimetype = mimeTypes[index] ?? "text/plain";

            res.setHeader("Content-type" , mimetype);
            res.end(data);
        }
        else {
            res.writeHead(404, `Not Found ${file_path}`);
            res.end();
        }
    });
});

server.listen(port, address, () => {
    console.log(`Server running on: http://${address}:${port}`);
});

server.on("error", (e) => {
    console.log(e.message);
});