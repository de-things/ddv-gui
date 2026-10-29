import { LayoutBuilder } from "./LayoutBuilder.js"
import { StorageMgr } from "../managers/StorageMgr.js"
import { PresetsMgr } from "../managers/PresetsMgr.js"
import { TilesGUI } from "../gui/TilesGUI.js"
import { AppGUI } from "../gui/AppGUI.js"
import { NavbarGUI } from "../gui/NavbarGUI.js"
import { PresetsGUI } from "../gui/PresetsGUI.js"
import { QRGUI } from "../gui/QRGUI.js"
import { AppConfigGUI } from "../gui/AppConfigGUI.js"
import { TileConfigGUI } from "../gui/TileConfigGUI.js"
import { PresetConfigGUI } from "../gui/PresetConfigGUI.js"
import * as Layout from "./Layout.js"

export class App {
    static #isIPv6(ip) {
        if (ip == "") return false;

        try {
            const url = new URL(`http://[${ip}]/`);
            return url.hostname.startsWith("[") && url.hostname.endsWith("]");
        } catch {
            return false;
        }
    }

    static #isIPv4(ip) {
        if (ip == "") return false;

        const seg = ip.trim().split(".");
        if (seg.length !== 4) return false;

        return seg.every(part =>
            /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255
        );
    }

    static validateIP(ip) {
        return this.#isIPv4(ip) || this.#isIPv6(ip);
    }

    static validateCmd(cmd) {
        return cmd.trim().length >= 1;
    }

    static validatePresetName(name) {
        if (!name || name.toString() == "") return false;

        let chars = /[` !@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/;
        return !chars.test(name);
    }

    /** Returns true if secret size is 32 bytes (requred for AES-256-GCM) */
    static validateSecret(secret) {
        return new TextEncoder().encode(secret).length === 32;
    }

    /** #f0f / #ff00ff => (255, 0, 255) */
    static hexToRgb(hex) {
        let result;

        if (hex.length == 4) {
            result = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
            result = result.map(b => b + b);
        }
        if (hex.length == 7) {
            result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        }
        
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /** returns text color (black or white) depending on `bg_color` brightness.
     * useful to automatically select color for text over some colorful backgrounds.
     * `bg_color` - Color value as a hex string.
     */
    static getTextColor(bg_color) {
        let color = App.hexToRgb(bg_color);
        let brightness = Math.round(.001 * (299*color.r + 587*color.g + 114*color.b));

        return (brightness > 125) ? "#000C" : "#FFFC";
    }

    static init() {
        LayoutBuilder.createLayoutItems(AppConfigGUI.config_items, Layout.config_app);
        LayoutBuilder.createLayoutItems(TileConfigGUI.config_items, Layout.config_tile);
        LayoutBuilder.createLayoutItems(PresetConfigGUI.config_items, Layout.config_preset);

        StorageMgr.trySetDefatuls();
        
        TilesGUI.updateGrid();
        PresetsMgr.fetchPresets();
        PresetsMgr.loadSelectedPreset();

        AppGUI.updateLayout();

        NavbarGUI.init();

        QRGUI.init();

        window.onpointerup = () => {
            clearTimeout(TilesGUI.tile_timeout_handler);
            clearTimeout(PresetsGUI.preset_timeout_handler);
            setTimeout(() => {
                TilesGUI.is_hold = false;
                PresetsGUI.is_hold = false;
            }, 10);
        }
    }
}