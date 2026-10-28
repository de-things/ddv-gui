
import { AppGUI } from "./AppGUI.js"
import { AppConfigGUI } from "./AppConfigGUI.js"
import * as Layout from "../env/Layout.js"

export class NavbarGUI {
    static init() {
        let config_app_nav_btn = document.getElementById("config_app_nav_btn");
        let presets_nav_btn = document.getElementById("presets_nav_btn");

        config_app_nav_btn.onclick = () => {
            if (window.getComputedStyle(Layout.config_app).display == "none") {
                AppConfigGUI.update();
                AppGUI.showGUI(Layout.config_app);
                AppGUI.hideGUI(Layout.presets, Layout.logs, Layout.config_tile);
            }
            else {
                AppGUI.hideGUI(Layout.config_app);
                AppGUI.showGUI(Layout.logs);
            }
        }

        presets_nav_btn.onclick = () => {
            if (window.getComputedStyle(Layout.presets).display == "none") {
                AppGUI.showGUI(Layout.presets);
                AppGUI.hideGUI(Layout.logs, Layout.config_app, Layout.config_tile);
            }
            else {
                AppGUI.hideGUI(Layout.presets);
                AppGUI.showGUI(Layout.logs);
            }
        }
    }
}