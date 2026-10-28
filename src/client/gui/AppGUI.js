import * as Layout from "../env/Layout.js"
import { AnimationMgr } from "../managers/AnimationMgr.js"
import { TilesGUI } from "./TilesGUI.js"
import { PresetsGUI } from "./PresetsGUI.js"

export class AppGUI {
    static #response_indicator_timeout;
    static showResponseIndicator(negative = false) {
        clearTimeout(this.#response_indicator_timeout);
        
        let response_indicator = document.getElementById("response_indicator");
        response_indicator.style.transition = "all 0ms";
        response_indicator.style.opacity = 1;
        response_indicator.offsetWidth;

        if (negative) {
            response_indicator.style.backgroundColor = "#D45";
            response_indicator.style.backgroundImage = `url("/assets/cross.svg")`;
        }
        else {
            response_indicator.style.backgroundColor = "#3A5";
            response_indicator.style.backgroundImage = `url("/assets/check.svg")`;
        }
        
        this.#response_indicator_timeout = setTimeout(()=>{
            response_indicator.style.transition = "all 120ms";
            response_indicator.style.opacity = 0;
        }, 500);
    }
    static updateLayout() {
        let layout_state = localStorage.getItem("layout_state");

        document.getElementById("area_A").style.flexDirection = layout_state == 1 ? "row" : "column";
        document.getElementById("area_A_navbar").style.flexDirection = layout_state == 1 ? "column" : "row";
        document.body.style.flexDirection = layout_state == 1 ? "column" : "row";
        document.body.style.width = layout_state == 1 ? "calc(100vw - 2rem)" : "calc(100vw - 3rem)";
        document.body.style.height = layout_state == 1 ? "calc(100dvh - 3rem)" : "calc(100dvh - 2rem)";
        document.body.style.minHeight = layout_state == 1 ? "calc(100dvh - 3rem)" : "calc(100dvh - 2rem)";
        document.documentElement.setAttribute("style", `--font-size: ${.1 * localStorage.getItem("font_size")}rem`);
    }

    static showGridGUI(...elements) {
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.display = "grid";
        }
    }

    static showGUI(...elements) {
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.display = "flex";

            if (elements[i] == Layout.config_app) {
                config_app_nav_btn.style.backgroundImage = `url("/assets/cross.svg")`;
                AnimationMgr.stop(document.getElementById("server_secret_input"), "error_impact");
                AnimationMgr.stop(document.getElementById("server_secret_sync_btn").parentElement, "error_impact_alt");

                let add_row_btn_parent = document.getElementById("add_row_btn").parentElement;
                AnimationMgr.stop(add_row_btn_parent, "translateXp");
                AnimationMgr.stop(add_row_btn_parent, "translateXn");

                let add_col_btn_parent = document.getElementById("add_col_btn").parentElement;
                AnimationMgr.stop(add_col_btn_parent, "translateXp");
                AnimationMgr.stop(add_col_btn_parent, "translateXn");

                let inc_font_size_btn_parent = document.getElementById("inc_font_size_btn").parentElement;
                AnimationMgr.stop(inc_font_size_btn_parent, "translateXp");
                AnimationMgr.stop(inc_font_size_btn_parent, "translateXn");
            }
            if (elements[i] == Layout.presets) {
                presets_nav_btn.style.backgroundImage = `url("/assets/cross.svg")`;
            }
            if (elements[i] == Layout.config_tile) {
                Layout.config_tile.scrollTo(0, 0); // reset scroll pos
                document.getElementById("area_A_navbar").style.display = "none";
            }
            if (elements[i] == Layout.config_preset) {
                Layout.config_preset.scrollTo(0, 0); // reset scroll pos
                document.getElementById("area_A_navbar").style.display = "none";
                AnimationMgr.stop(document.getElementById("preset_name_input"), "error_impact");
            }
        }
    }

    static hideGUI(...elements) {
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.display = "none";

            if (elements[i] == Layout.config_app) {
                config_app_nav_btn.style.backgroundImage = `url("/assets/gear.svg")`;
            }
            if (elements[i] == Layout.presets) {
                presets_nav_btn.style.backgroundImage = `url("/assets/presets.svg")`;
            }
            if (elements[i] == Layout.config_tile) {
                // stop wiggle animation since tile should be visually "disselected"
                AnimationMgr.stop(TilesGUI.selected_tile_element, "wiggle");
                TilesGUI.selected_tile_element = null;
                document.getElementById("area_A_navbar").style.display = "flex";
            }
            if (elements[i] == Layout.config_preset) {
                // stop wiggle animation since preset should be visually "disselected"
                AnimationMgr.stop(PresetsGUI.selected_preset_element, "wiggle");
                PresetsGUI.selected_preset_element = null;
                document.getElementById("area_A_navbar").style.display = "flex";
            }
        }
    }

    static isGUIOpened(element) {
        return window.getComputedStyle(element).display != "none";
    }
}