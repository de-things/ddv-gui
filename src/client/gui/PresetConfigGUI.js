import { DelibAPI } from "../libs/delib/index.js"
import { AppGUI } from "./AppGUI.js"
import { TilesGUI } from "./TilesGUI.js"
import { PresetsGUI } from "./PresetsGUI.js"
import { AnimationMgr } from "../managers/AnimationMgr.js"
import { PresetsMgr } from "../managers/PresetsMgr.js"
import { App } from "../env/App.js"
import * as Layout from "../env/Layout.js"

export class PresetConfigGUI {
    static config_items = {
        preset_name: {
            item: {
                preset_name_input: {
                    type: "input",
                    stretched: true,
                    placeholder: "Preset name",
                    on_submit: () => {
                        document.getElementById("preset_name_input").blur();
                    }
                },
            }
        },
        preset_save_remove: {
            preset_save: {
                preset_save_btn: {
                    type: "btn",
                    text: "Save",
                    input_to_tile: true,
                    on_click: this.renameSelectedPreset
                },
            },
            preset_remove: {
                preset_remove_btn: {
                    type: "btn",
                    text: "Remove",
                    input_to_tile: true,
                    outlined: true,
                    color: "#D45",
                    on_click: this.removeSelectedPreset
                },
            }
        },
    }
    static update() {
        document.getElementById("preset_name_input").value = PresetsGUI.selected_preset_name;
    }

    static async renameSelectedPreset() {
        let preset_name_input = document.getElementById("preset_name_input");
        if (!App.validatePresetName(preset_name_input.value)) {
            AnimationMgr.stop(preset_name_input, "error_impact");
            AnimationMgr.play(preset_name_input, "error_impact");
            return;
        }

        DelibAPI.request("/rename_preset", App.server_secret(), 
            JSON.stringify({
                old_preset_id: localStorage.getItem("preset_id"),
                new_preset_id: preset_name_input.value
            }))
            .then(res => {
                if (!res) return AppGUI.showResponseIndicator(true);

                AppGUI.showResponseIndicator();
                localStorage.setItem("preset_id", preset_name_input.value);

                AppGUI.hideGUI(config_preset);
                AppGUI.showGridGUI(tiles);

                PresetsMgr.fetchPresets();
                PresetsMgr.loadSelectedPreset();
            }
        );
    }
    static async removeSelectedPreset() {
        DelibAPI.request("/remove_preset", App.server_secret(), localStorage.getItem("preset_id"))
            .then(res => {
                if (!res) return AppGUI.showResponseIndicator(true);

                if (localStorage.getItem("preset_id") == PresetsGUI.selected_preset_name) {
                    localStorage.removeItem("preset_id");
                    TilesGUI.clearTiles();
                }

                presets.removeChild(PresetsGUI.selected_preset_element);
                PresetsGUI.selected_preset_name = null;
                PresetsMgr.selected_preset = {};

                AppGUI.hideGUI(Layout.config_preset);
                AppGUI.showGridGUI(Layout.tiles);

                AppGUI.showResponseIndicator();
                PresetsMgr.fetchPresets();
            });
    }
}