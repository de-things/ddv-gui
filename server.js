import https from "https";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as SecurityMgr from "./src/server/SecurityMgr.js";
import * as ConfigMgr from "./src/server/ConfigMgr.js";

const MIME_TYPES = {
    ".html" : "text/html",
    ".css"  : "text/css",
    ".js"   : "text/javascript",
    ".svg"  : "image/svg+xml",
    ".woff2": "font/woff2"
};

ConfigMgr.init();

// true if `value` is JSON object
const isJsonObject = value => value !== null && typeof value === "object" && !Array.isArray(value);

const writeForbidden = (res) => res.writeHead(403).end();
const writeIntError = res => res.writeHead(500).end();
const writeNotFound = res => res.writeHead(404).end();
const writeTeapot = res => res.writeHead(418).end();

// main server to handle backend
https.createServer(ConfigMgr.credentials(), (req, res) => {
    if (req.method === "POST") {
        const BODY = [];
        
        req.on("data", chunk => BODY.push(chunk));

        req.on("end", () => {
            const BUFFER = Buffer.concat(BODY);

            if (BUFFER.byteLength > ConfigMgr.request_max_bytes()) { // decline requests above config limit
                console.log(`Received a request [${req.url}] with a size of [${BUFFER.byteLength}] bytes... and was declined!`);
                return writeTeapot(res);
            }

            const ENC_BASE64 = BUFFER.toString();
            const DEC_DATA = SecurityMgr.decrypt(ENC_BASE64);

            if (!DEC_DATA) return writeForbidden(res);

            /** request json object (may be empty if no json was sent) */
            let req_json = {};

            try {
                req_json = JSON.parse(DEC_DATA);
            }
            catch {}

            // URL HANDLERS 
            //
            if (req.url == "/api") {
                let ip_type = SecurityMgr.validateIP(req_json.ip); // type 4, 6

                if (!ip_type) return writeForbidden(res);

                let url = ip_type == 4 ? req_json.ip : `[${req_json.ip}]`;

                fetch(`http://${url}/`, { 
                    method:     "POST", 
                    body:       req_json.enc_cmd,
                    cache:      "no-cache",
                    keepalive:  false,
                    signal:     AbortSignal.timeout(2000)
                }).then(raw => { 
                    raw.text().then(data => {
                        res.end(data);
                    }); 
                }).catch(e => { 
                    writeTeapot(res);
                });
            }
            else if (req.url == "/get_preset_data") {
                if (!SecurityMgr.validatePresetName(DEC_DATA)) {
                    return writeForbidden(res);
                }
                
                fs.readFile(path.join(ConfigMgr.db_path(), `${DEC_DATA}.json`), { encoding: "utf-8" }, (err, data) => {
                    if (err) return writeNotFound(res);
                    res.end(SecurityMgr.encrypt(data));
                });
            }
            else if (req.url == "/get_presets") {
                fs.readdir(ConfigMgr.db_path(), (err, data) => {
                    if (err) return writeIntError();

                    res.end(SecurityMgr.encrypt(
                        JSON.stringify({ 
                            data: data.map(file => path.parse(file).name) 
                        })
                    ));
                });
            }
            else if (req.url == "/add_tile") {
                if (!SecurityMgr.validatePresetName(DEC_DATA)) {
                    return writeForbidden(res);
                }

                let preset_path = path.join(ConfigMgr.db_path(), `${DEC_DATA}.json`);
                
                if (fs.existsSync(preset_path)) { // check if specified preset file exist
                    fs.readFile(preset_path, { encoding: "utf-8" }, (err, data) => {
                        // get preset data
                        let json;

                        try {
                            json = JSON.parse(data)
                        }
                        catch {
                            return writeIntError(res);
                        }

                        let tile_data = { // create new tile instance
                            title: "NEW TILE",
                            ip: "",
                            cmd: "",
                            secret: "",
                            color: "#444"
                        }

                        // add new tile (button)
                        json.tiles.push(tile_data);

                        // update preset file
                        fs.writeFile(preset_path, JSON.stringify(json), (err) => {
                            if (err) return writeIntError(res);
                            // respond with a created tile data
                            res.end(SecurityMgr.encrypt(JSON.stringify(tile_data)));
                        });
                    });
                }
            }
            else if (req.url == "/add_preset") {
                let preset_data = {
                    title: `preset_${SecurityMgr.rndHex(2)}`
                }

                let file_path = path.join(ConfigMgr.db_path(), `${preset_data.title}.json`);

                if (fs.existsSync(file_path)) {
                    // such preset file already exist, so respond with an error
                    return writeIntError();
                }

                // write new preset file into specified chunk
                fs.writeFile(file_path, JSON.stringify({ tiles: [] }), (err) => {
                    if (err) return writeIntError(res);
                    // respond with a new preset data
                    res.end(SecurityMgr.encrypt(JSON.stringify(preset_data)));
                });
            }
            else if (req.url == "/remove_preset") {
                if (!SecurityMgr.validatePresetName(DEC_DATA)) {
                    return writeForbidden(res);
                }

                fs.rm(path.join(ConfigMgr.db_path(), `${DEC_DATA}.json`), (err) => {
                    if (err) return writeIntError();
                    res.end();
                });
            }
            else if (req.url == "/rename_preset") {                
                if (!SecurityMgr.validatePresetName(req_json.new_preset_id)) {
                    return writeForbidden(res);
                }

                let old_name = path.join(ConfigMgr.db_path(), `${req_json.old_preset_id}.json`);
                let new_name = path.join(ConfigMgr.db_path(), `${req_json.new_preset_id}.json`);

                if (old_name == new_name) {
                    return res.end();
                }

                if (fs.existsSync(new_name)) {
                    return writeForbidden(res);
                }

                fs.rename(old_name, new_name, (err) => {
                    if (err) return writeForbidden();
                    res.end();
                });
            }
            else if (req.url == "/save_preset_data") {
                if (!SecurityMgr.validatePresetName(req_json.preset_id) || !isJsonObject(req_json.data)) {
                    return writeForbidden(res);
                }

                fs.writeFile(path.join(ConfigMgr.db_path(), `${req_json.preset_id}.json`), JSON.stringify(req_json.data), { encoding: "utf-8" }, (err) => {
                    if (err) return writeIntError();
                    res.end();
                });
            }
        });

        return; // end of POST request condition
    }

    // try to send back a file from 'public/'
    let file_path = req.url == "/" ? "index.html" : req.url;

    file_path = file_path.replaceAll("..", ""); // prevent from breaking file system

    fs.readFile(path.join(ConfigMgr.public_dir(), file_path), (err, data) => {
        if (err) return writeNotFound(res);

        const MIMETYPE = MIME_TYPES[path.parse(file_path).ext];
        if (!MIMETYPE) return writeForbidden(res);

        res.setHeader("Content-type" , MIMETYPE);
        res.end(data);
    });
}).listen(ConfigMgr.port(), "0.0.0.0", () => {
    console.log("Server is running.");
    console.log(`Localhost: https://localhost:${ConfigMgr.port()}`);
});