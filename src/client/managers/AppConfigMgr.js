import { AnimationMgr } from "./AnimationMgr.js"
import { PresetsMgr } from "./PresetsMgr.js"
import { App } from "../env/App.js"
import { PresetsGUI } from "../gui/PresetsGUI.js"
import { TilesGUI } from "../gui/TilesGUI.js"
import { AppGUI } from "../gui/AppGUI.js"
import * as Layout from "../env/Layout.js"

export class AppConfigMgr {
    static genRndStr() {
        return (Math.random() + 1).toString(16).substring(2);
    }

    /** Updates server private key (secret) in local storage 
     * and fetches presets data right after using this key. */
    static syncServerSecretID() {
        let server_secret_input = document.getElementById("server_secret_input");
        if (!App.validateSecret(server_secret_input.value)) {
            AnimationMgr.stop(server_secret_input, "error_impact");
            AnimationMgr.play(server_secret_input, "error_impact");
            return;
        }

        localStorage.setItem("server_secret", server_secret_input.value);
        localStorage.removeItem("preset_id");

        PresetsGUI.clearPresets();
        TilesGUI.clearTiles();
        PresetsMgr.fetchPresets();

        AppGUI.hideGUI(Layout.config_app, Layout.logs);
        AppGUI.showGUI(Layout.presets);
    }
}