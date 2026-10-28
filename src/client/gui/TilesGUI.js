import { AppGUI } from "./AppGUI.js"
import { AppConfigGUI } from "./AppConfigGUI.js"
import { LogsGUI } from "./LogsGUI.js"
import { TileConfigGUI } from "./TileConfigGUI.js"
import { PresetsMgr } from "../managers/PresetsMgr.js"
import { AnimationMgr } from "../managers/AnimationMgr.js"
import { CryptoMgr } from "../managers/CryptoMgr.js"
import { DDVMgr } from "../managers/DDVMgr.js"
import { App } from "../env/App.js"
import * as Layout from "../env/Layout.js"

export class TilesGUI {
    static current_page = 0;
    static selected_tile_index = 0;
    static selected_tile; // html element of select tile
    static selected_tile_element;
    static tile_timeout_handler;
    static is_hold = false;

    static hasPrevPage(page_number) {
        return page_number > 0;
    }

    static getPageInfo(page_number) {
        let grid_size = localStorage.getItem("grid_x") * localStorage.getItem("grid_y");
        let tiles_size = grid_size - 1;

        // dec index whenever prev page btn exist
        if (this.hasPrevPage(page_number)) {
            tiles_size--;
        }

        let start_index = 0;

        for (let i = 0; i < page_number; i++) {
            start_index += grid_size - 1;
            if (this.hasPrevPage(i)) {
                start_index--;
            }
        }

        let prevPage = start_index > 0;
        let nextPage = start_index + tiles_size < PresetsMgr.selected_preset.tiles.length;

        return {
            tiles_size, // max tiles drawn by page (excluding service tiles)
            start_index, // tile index to start draw page from
            nextPage, // whenever page has a heir
            prevPage, // whenever page has an ancestor
        };
    }

    static addTileNode(index, tile_data, on_click) {
        const tile = document.createElement("div");
        tile.classList.add("tile", "tile_btn");
        tile.innerHTML = tile_data.title;
        tile.style.backgroundColor = tile_data.color;

        // calc text color to make it readable for most tile colors
        tile.style.color = App.getTextColor(tile_data.color);

        Layout.tiles.insertBefore(tile, document.getElementById("add_tile_btn"));

        tile.onclick = () => {
            if (this.is_hold) return; // do not proceed onclick event of a tile since it has invoked "onhold" event
            on_click();
        }

        tile.onpointerdown = () => {
            AppGUI.hideGUI(Layout.presets, Layout.config_app, Layout.config_tile, Layout.qr_gui);
            AppGUI.showGUI(Layout.logs);

            this.tile_timeout_handler = setTimeout(() => {
                this.selected_tile_index = index;
                TileConfigGUI.update();
                AnimationMgr.stop(TilesGUI.selected_tile_element, "wiggle");
                TilesGUI.selected_tile_element = tile;
                AnimationMgr.play(TilesGUI.selected_tile_element, "wiggle"); // start wiggle animation since selected
                AppGUI.showGUI(Layout.config_tile);
                AppGUI.hideGUI(Layout.config_app, Layout.logs, Layout.presets);

                this.is_hold = true;
            }, 500);
        }

        tile.onpointerleave = () => {
            clearTimeout(TilesGUI.tile_timeout_handler);
            setTimeout(() => {
                TilesGUI.is_hold = false;
            }, 10);
        }

        return tile;
    }

    static updateGrid() {
        let x = localStorage.getItem("grid_x");
        let y = localStorage.getItem("grid_y");

        Layout.tiles.style.gridTemplateRows = "";
        Layout.tiles.style.gridTemplateColumns = "";

        for (let i = 0; i < y; i++) {
            Layout.tiles.style.gridTemplateRows += " 1fr";
        }
        for (let i = 0; i < x; i++) {
            Layout.tiles.style.gridTemplateColumns += " 1fr";
        }

        AppConfigGUI.update();
        TilesGUI.drawPage();
    }

    static clearTiles() {
        Layout.tiles.innerHTML = "";
    }

    /** draws current page of selected preset in TilesGUI */
    static drawPage() {
        if (!PresetsMgr.selected_preset.tiles) {
            return;
        }

        let page_info = this.getPageInfo(TilesGUI.current_page);

        if (page_info.start_index > PresetsMgr.selected_preset.tiles.length) {
            TilesGUI.current_page--;
            this.drawPage();
            return;
        }

        TilesGUI.clearTiles(); // clear old tiles gui

        // btn to go to prev page of tiles
        let prev_tile_btn = document.createElement("div");
        prev_tile_btn.classList.add("tile", "basic_item_icon", "tile_btn");
        prev_tile_btn.id = "prev_tile_btn";
        prev_tile_btn.style.backgroundImage = `url("/assets/arrow_l.svg")`;
        prev_tile_btn.style.display = page_info.prevPage ? "flex" : "none";
        Layout.tiles.appendChild(prev_tile_btn);

        prev_tile_btn.onclick = () => {
            if (page_info.prevPage) {
                TilesGUI.current_page--;
                this.drawPage();
            }
        }

        let add_tile_btn = document.createElement("div");
        add_tile_btn.classList.add("tile", "basic_item_icon", "tile_btn");
        add_tile_btn.id = "add_tile_btn";
        add_tile_btn.style.backgroundImage = `url("/assets/plus.svg")`;
        add_tile_btn.style.display = page_info.nextPage ? "none" : "flex";
        Layout.tiles.appendChild(add_tile_btn);

        // add new tile to a preset by clicking add tile btn
        add_tile_btn.onclick = async () => {
            fetch(`/add_tile`, {
                method: "POST", 
                body: await CryptoMgr.encrypt(localStorage.getItem("preset_id"), localStorage.getItem("server_secret"))
            })
            .then(res => { if (res.ok) return res.text(); })
            .then(async enc_base64 => {
                let dec_data = await CryptoMgr.decrypt(enc_base64, localStorage.getItem("server_secret"));
                if (!dec_data) return;
                
                let json = JSON.parse(dec_data);

                PresetsMgr.selected_preset.tiles.push(json);
                let tile_id = PresetsMgr.selected_preset.tiles.length - 1;
                TilesGUI.addTileNode(tile_id, json, () => {
                    DDVMgr.request(json.ip, json.cmd, json.secret).then(ddv_res => {
                        if (ddv_res) {
                            LogsGUI.printResMessage(json.ip, ddv_res);
                        }
                    });
                });
                this.drawPage();
                AppGUI.showResponseIndicator();
            });
        }

        let offset = page_info.start_index + page_info.tiles_size;

        if (offset > PresetsMgr.selected_preset.tiles.length) {
            offset = PresetsMgr.selected_preset.tiles.length;
        }

        for (let i = page_info.start_index; i < offset; i++) {
            const tile_data = PresetsMgr.selected_preset.tiles[i];
            TilesGUI.addTileNode(i, tile_data, () => {
                DDVMgr.request(tile_data.ip, tile_data.cmd, tile_data.secret).then(ddv_res => {
                    if (ddv_res) {
                        LogsGUI.printResMessage(tile_data.ip, ddv_res);
                    }
                });
            });
        }

        // btn to go to prev page of tiles
        let next_tile_btn = document.createElement("div");
        next_tile_btn.classList.add("tile", "basic_item_icon", "tile_btn");
        next_tile_btn.id = "next_tile_btn";
        next_tile_btn.style.backgroundImage = `url("/assets/arrow_r.svg")`;
        next_tile_btn.style.display = page_info.nextPage ? "flex" : "none";
        tiles.appendChild(next_tile_btn);

        next_tile_btn.onclick = () => {
            if (page_info.nextPage) {
                TilesGUI.current_page++;
                this.drawPage();
            }
        }

        if (AppGUI.isGUIOpened(Layout.config_tile)) {
            AppGUI.hideGUI(Layout.config_tile);
            AppGUI.showGUI(Layout.logs);
        }
    }
}