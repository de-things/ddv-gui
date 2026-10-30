import { DelibAPI } from "../libs/delib/index.js"
import { PresetsGUI } from "../gui/PresetsGUI.js"
import { TilesGUI } from "../gui/TilesGUI.js"
import { AppGUI } from "../gui/AppGUI.js"
import * as Layout from "../env/Layout.js"
import { App } from "../env/App.js"

export class PresetsMgr {
    static selected_preset = {}

    static async loadSelectedPreset() {
        if (!localStorage.getItem("preset_id")) return;

        DelibAPI.request("/get_preset_data", App.server_secret(), localStorage.getItem("preset_id"))
        .then(res => {
            if (!res) return AppGUI.showResponseIndicator(true);

            let json = JSON.parse(res);

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
        DelibAPI.request("/save_preset_data", App.server_secret(), 
            JSON.stringify({
                preset_id: localStorage.getItem("preset_id"),
                data: PresetsMgr.selected_preset
            })).then(res => {
                if (!res) return AppGUI.showResponseIndicator(true);

                AppGUI.showResponseIndicator();
                TilesGUI.drawPage();
            }
        );
    }

    static async fetchPresets() {
        // get list of all presets related to a selected chunk
        DelibAPI.request("/get_presets", App.server_secret(), "0")
            .then(res => {
                if (!res) return AppGUI.showResponseIndicator(true);

                let json = JSON.parse(res);

                // ...received presets list

                // clear old presets gui
                PresetsGUI.clearPresets();

                let add_preset_btn = document.createElement("div");
                add_preset_btn.classList.add("basic_item", "basic_item_icon", "tile_btn");
                add_preset_btn.id = "add_preset_btn";
                add_preset_btn.style.backgroundImage = `url("/assets/plus.svg")`;
                Layout.presets.appendChild(add_preset_btn);

                add_preset_btn.onclick = async () => {
                    DelibAPI.request("/add_preset", App.server_secret(), "0")
                    .then(res => {
                        if (!res) return AppGUI.showResponseIndicator(true);

                        let json = JSON.parse(res);
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
            }
        );
    }
}