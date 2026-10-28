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
    ".woff2": "font/woff2",
    ".json" : "application/json",
};

ConfigMgr.init();

// main server to handle backend
https.createServer(ConfigMgr.credentials(), (req, res) => {
    if (req.method === "POST") {
        const BODY = [];
        
        req.on("data", chunk => BODY.push(chunk));

        req.on("end", () => {
            const BUFFER = Buffer.concat(BODY);

            if (BUFFER.byteLength > ConfigMgr.request_max_bytes()) { // decline requests above config limit
                console.log(`Received a request [${req.url}] with a size of [${BUFFER.byteLength}] bytes... and was declined!`);
                res.writeHead(400, "Too heavy request"); res.end(); return;
            }

            const ENC_BASE64 = BUFFER.toString();
            const DEC_DATA = SecurityMgr.decrypt(ENC_BASE64);

            if (!DEC_DATA) {
                res.writeHead(403, "Forbidden"); res.end(); return;
            }

            // URL HANDLERS 
            //
            if (req.url == "/api") {
                let json = JSON.parse(DEC_DATA);
                let ip_type = SecurityMgr.validateIP(json.ip); // type 4, 6

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
                        res.end(data);
                    }); 
                }).catch(e => { 
                    res.writeHead(400, "No ddv response");
                    res.end();
                });
            }
            else if (req.url == "/get_preset_data") {
                if (!SecurityMgr.validatePresetName(DEC_DATA)) {
                    res.writeHead(403, "Forbidden"); res.end();
                    return;
                }
                
                fs.readFile(path.join(ConfigMgr.db_path(), `${DEC_DATA}.json`), { encoding: "utf-8" }, (err, _data) => {
                    if (!err) {
                        let res_enc_base64 = SecurityMgr.encrypt(_data);
                        res.end(res_enc_base64);
                    }
                    else {
                        res.writeHead(404, "Not Found");
                        res.end();
                    }
                });
            }
            else if (req.url == "/get_presets") {
                fs.readdir(ConfigMgr.db_path(), (err, _data) => {
                    if (!err) {
                        res.end(SecurityMgr.encrypt(
                            JSON.stringify({ 
                                data: _data.map(file => file.replace(".json", "")) 
                            })
                        ));
                    }
                    else {
                        res.writeHead(400, "Something went wrong with the server!");
                    }
                    res.end();
                });
            }
            else if (req.url == "/add_tile") {
                if (!SecurityMgr.validatePresetName(DEC_DATA)) {
                    res.writeHead(403, "Forbidden"); res.end();
                    return;
                }

                let preset_path = path.join(ConfigMgr.db_path(), `${DEC_DATA}.json`);
                
                if (fs.existsSync(preset_path)) { // check if specified preset file exist
                    fs.readFile(preset_path, { encoding: "utf-8" }, (err, data) => {
                        // get preset data
                        let json = JSON.parse(data);

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
                        fs.writeFileSync(preset_path, JSON.stringify(json));

                        // 
                        res.writeHead(200);
                        res.end(SecurityMgr.encrypt(JSON.stringify(tile_data)));
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
                    res.writeHead(400, "Something went wrong"); res.end();
                    return;
                }

                // write new preset file into specified chunk
                fs.writeFileSync(file_path, JSON.stringify({ tiles: [] }));

                // respond with a new preset data
                res.writeHead(200, "OK");
                res.end(SecurityMgr.encrypt(JSON.stringify(preset_data)));
            }
            else if (req.url == "/remove_preset") {
                if (!SecurityMgr.validatePresetName(DEC_DATA)) {
                    res.writeHead(403, "Forbidden"); res.end();
                    return;
                }

                fs.rm(path.join(ConfigMgr.db_path(), `${DEC_DATA}.json`), (err) => {
                    if (!err) {
                        res.writeHead(200, "OK");
                        res.end();
                    }
                    else {
                        res.writeHead(400, "Something went wrong");
                        res.end();
                    }
                });
            }
            else if (req.url == "/rename_preset") {
                let json = JSON.parse(DEC_DATA);
                
                if (!SecurityMgr.validatePresetName(json.new_preset_id)) {
                    res.writeHead(403, "Forbidden"); res.end();
                    return;
                }

                let old_name = path.join(ConfigMgr.db_path(), `${json.old_preset_id}.json`);
                let new_name = path.join(ConfigMgr.db_path(), `${json.new_preset_id}.json`);

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
            }
            else if (req.url == "/save_preset_data") {
                let json = JSON.parse(DEC_DATA);

                if (!SecurityMgr.validatePresetName(json.preset_id)) {
                    res.writeHead(403, "Forbidden"); res.end();
                    return;
                }

                fs.writeFile(path.join(ConfigMgr.db_path(), `${json.preset_id}.json`), JSON.stringify(json.data), { encoding: "utf-8" }, (err, _data) => {
                    if (!err) {
                        res.writeHead(200, "OK");
                        res.end();
                    }
                    else {
                        res.writeHead(400, "Something went wrong");
                        res.end();
                    }
                });
            }
        });

        return;
    }

    // try to send back a file from 'public/'
    let file_path = req.url == "/" ? "index.html" : req.url;

    file_path = file_path.replaceAll("..", ""); // prevent from breaking file system

    fs.readFile(path.join(ConfigMgr.public_dir(), file_path), (err, data) => {
        if (!err) {
            const offset = file_path.lastIndexOf(".");
            const index = offset == -1 ? "" : file_path.substr(offset);

            const mimetype = MIME_TYPES[index] ?? "text/plain";

            res.setHeader("Content-type" , mimetype);
            res.end(data);
        }
        else {
            res.writeHead(404, `Not Found ${file_path}`);
            res.end();
        }
    });
}).listen(ConfigMgr.port(), "0.0.0.0", () => {
    console.log(`Server is running on: https://localhost:${ConfigMgr.port()}`);
});