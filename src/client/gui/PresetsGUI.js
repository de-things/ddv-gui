import { AppGUI } from "./AppGUI.js"
import { PresetConfigGUI } from "./PresetConfigGUI.js"
import { AnimationMgr } from "../managers/AnimationMgr.js"
import { PresetsMgr } from "../managers/PresetsMgr.js"
import * as Layout from "../env/Layout.js"

export class PresetsGUI {
    static is_hold = false;
    static preset_timeout_handler;
    static selected_preset_element;
    static selected_preset_name;

    static addPresetNode(preset_name, on_click) {
        const preset = document.createElement("div");
        preset.classList.add("basic_item", "tile_btn");
        preset.innerHTML = preset_name;
        preset.setAttribute("preset_id", preset_name); // id used to access preset's content via db 

        Layout.presets.insertBefore(preset, document.getElementById("add_preset_btn"));

        preset.onclick = (ev) => {
            if (this.is_hold) return; // do not proceed onclick event of a preset since it has invoked "onhold" event
            on_click();
        }

        preset.onpointerdown = () => {
            if (AppGUI.isGUIOpened(Layout.config_preset)) {
                AppGUI.hideGUI(Layout.config_preset);
                AppGUI.showGridGUI(Layout.tiles);
            }

            this.preset_timeout_handler = setTimeout(() => {
                this.selected_preset_name = preset_name;
                PresetConfigGUI.update();
                AnimationMgr.stop(this.selected_preset_element, "wiggle");
                this.selected_preset_element = preset;
                AnimationMgr.play(this.selected_preset_element, "wiggle"); // start wiggle animation since selected
                AppGUI.showGUI(Layout.config_preset);
                AppGUI.hideGUI(Layout.tiles);

                on_click();

                this.is_hold = true;
            }, 500);
        }

        return preset;
    }

    static onPresetSelected(preset_node) {
        // update selected preset id
        localStorage.setItem("preset_id", preset_node.getAttribute("preset_id"));
        PresetsMgr.loadSelectedPreset();
    }

    static clearPresets() {
        Layout.presets.innerHTML = "";
    }

    /** visualizes which preset is selected in presets gui */
    static updateSelectedPreset() {
        for (let child of Layout.presets.children) {
            if (child.innerHTML == localStorage.getItem("preset_id")) {
                child.style.opacity = "1";
            }
            else if (child.id != "add_preset_btn") {
                child.style.opacity = ".5";
            }
        }
    }
}