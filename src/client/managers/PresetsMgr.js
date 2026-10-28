import { CryptoMgr } from "./CryptoMgr.js"
import { PresetsGUI } from "../gui/PresetsGUI.js"
import { TilesGUI } from "../gui/TilesGUI.js"
import { AppGUI } from "../gui/AppGUI.js"
import * as Layout from "../env/Layout.js"

export class PresetsMgr {
    static selected_preset = {}

    static async loadSelectedPreset() {
        if (!localStorage.getItem("preset_id")) {
            return;
        }

        // load preset
        fetch(`/get_preset_data`, {
            method: "POST", 
            body: await CryptoMgr.encrypt(localStorage.getItem("preset_id"), localStorage.getItem("server_secret"))
        })
        .then(res => { if (res.ok) return res.text(); })
        .then(async enc_base64 => {
            let dec_data = await CryptoMgr.decrypt(enc_base64, localStorage.getItem("server_secret"));
            if (!dec_data) return;
            
            let json = JSON.parse(dec_data);

            PresetsMgr.selected_preset = json; // store for later
            TilesGUI.current_page = 0; // reset tiles page

            // ...received preset data

            TilesGUI.drawPage(); // draw page of preset tiles in tiles gui
            PresetsGUI.updateSelectedPreset(); // update preset selected state
            AppGUI.showResponseIndicator(); // show respone indicator to determine server responded OK
        });
    }

    static async saveSelectedPreset() {
        // sync data with server
        fetch(`/save_preset_data`, {
            method: "POST", 
            body:   await CryptoMgr.encrypt(
                        JSON.stringify({
                            preset_id: localStorage.getItem("preset_id"),
                            data: PresetsMgr.selected_preset
                        }),
                        localStorage.getItem("server_secret")
                    )
        })
        .then(res => { 
            if (res.ok) {
                AppGUI.showResponseIndicator();
                TilesGUI.drawPage();
            }
        });
    }

    static async fetchPresets() {
        // get list of all presets related to a selected chunk
        fetch('/get_presets', { 
            method: "POST", 
            body: await CryptoMgr.encrypt("0", localStorage.getItem("server_secret"))
        })
        .then(res => { if (res.ok) return res.text(); })
        .then(async enc_base64 => {
            let dec_data = await CryptoMgr.decrypt(enc_base64, localStorage.getItem("server_secret"));
            if (!dec_data) return;
            
            let json = JSON.parse(dec_data);

            // ...received presets list

            // clear old presets gui
            PresetsGUI.clearPresets();

            let add_preset_btn = document.createElement("div");
            add_preset_btn.classList.add("basic_item", "basic_item_icon", "tile_btn");
            add_preset_btn.id = "add_preset_btn";
            add_preset_btn.style.backgroundImage = `url("/assets/plus.svg")`;
            Layout.presets.appendChild(add_preset_btn);

            add_preset_btn.onclick = async () => {
                fetch(`/add_preset`, {
                    method: "POST", 
                    body: await CryptoMgr.encrypt("0", localStorage.getItem("server_secret"))
                })
                .then(res => { if (res.ok) return res.text(); })
                .then(async enc_base64 => {
                    let dec_data = await CryptoMgr.decrypt(enc_base64, localStorage.getItem("server_secret"));
                    if (!dec_data) return;
                    
                    let json = JSON.parse(dec_data);
                    let preset_node = PresetsGUI.addPresetNode(json.title, () => {
                        PresetsGUI.onPresetSelected(preset_node);
                    });
                    // select preset right after created
                    PresetsGUI.onPresetSelected(preset_node);
                    AppGUI.showResponseIndicator();

                    AppGUI.hideGUI(Layout.config_preset);
                    AppGUI.showGridGUI(Layout.tiles);

                    Layout.presets.scrollBy(0, Layout.presets.scrollHeight);
                });
            }

            // fill presets gui with received data
            for (let i = 0; i < json.data.length; i++) {
                let preset_node = PresetsGUI.addPresetNode(json.data[i], () => {
                    PresetsGUI.onPresetSelected(preset_node);
                });
            }

            PresetsGUI.updateSelectedPreset();
            AppGUI.showResponseIndicator();
        })
    }
}