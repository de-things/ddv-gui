const presets = document.getElementById("presets");
const tiles = document.getElementById("tiles");
const config_app = document.getElementById("config_app");
const config_tile = document.getElementById("config_tile");
const config_preset = document.getElementById("config_preset");
const logs = document.getElementById("logs");

class NavbarGUI {
    static init() {
        let config_app_nav_btn = document.getElementById("config_app_nav_btn");
        let presets_nav_btn = document.getElementById("presets_nav_btn");

        config_app_nav_btn.onclick = () => {
            if (window.getComputedStyle(config_app).display == "none") {
                AppConfigGUI.update();
                AppGUI.showGUI(config_app);
                AppGUI.hideGUI(presets, logs, config_tile);
            }
            else {
                AppGUI.hideGUI(config_app);
                AppGUI.showGUI(logs);
            }
        }

        presets_nav_btn.onclick = () => {
            if (window.getComputedStyle(presets).display == "none") {
                AppGUI.showGUI(presets);
                AppGUI.hideGUI(logs, config_app, config_tile);
            }
            else {
                AppGUI.hideGUI(presets);
                AppGUI.showGUI(logs);
            }
        }
    }
}

class TileConfigGUI {
    static config_items = {
        type: {
            tile_0: {
                tile_type_btn_title: {
                    type: "text",
                    text: "Type",
                    backgroundColor: "#333"
                },
            },
            tile_1: {
                tile_type_btn: {
                    type: "btn",
                    input_to_tile: true,
                    text: "DEFAULT",
                    on_click: () => { console.log("todo") }
                },
            }
            
        },
        title: {
            tile_item: {
                tile_title_input: {
                    type: "input",
                    placeholder: "Title",
                    on_submit: () => {
                        document.getElementById("tile_color_input").focus();
                    }
                },
            }
        },
        color: {
            tile_item: {
                tile_color_input: {
                    type: "input",
                    placeholder: "Color (HEX)",
                    on_submit: () => {
                        document.getElementById("tile_ip_input").focus();
                    }
                },
            }
        },
        ip: {
            tile_item: {
                tile_ip_input: {
                    type: "input",
                    placeholder: "DDV address (IP)",
                    on_submit: () => {
                        document.getElementById("tile_cmd_input").focus();
                    }
                },
            }
        },
        cmd: {
            tile_item: {
                tile_cmd_input: {
                    type: "input",
                    placeholder: "DDV command (!cmd)",
                    on_submit: () => {
                        document.getElementById("tile_cmd_input").blur();
                        config_tile.scrollBy(0, config_tile.scrollHeight);
                    }
                },
            }
        },
        tile_save_remove: {
            tile_save: {
                tile_save_btn: {
                    type: "btn",
                    text: "Save",
                    input_to_tile: true,
                    on_click: this.saveSelectedTile
                },
            },
            tile_remove: {
                tile_remove_btn: {
                    type: "btn",
                    text: "Remove",
                    input_to_tile: true,
                    outlined: true,
                    color: "#f77",
                    on_click: this.removeSelectedTile
                },
            }
        },
    };

    /** Updates elements' content in tiles config gui. */
    static update() {
        let tile_instance = PresetsMgr.selected_preset.tiles[TilesGUI.selected_tile_id];
        document.getElementById("tile_title_input").value = tile_instance.title;
        document.getElementById("tile_color_input").value = tile_instance.color;
        document.getElementById("tile_ip_input").value = tile_instance.ip;
        document.getElementById("tile_cmd_input").value = tile_instance.cmd;
    }

    static saveSelectedTile() {
        // save changes into preset obj
        PresetsMgr.selected_preset.tiles[TilesGUI.selected_tile_id] = {
            title: document.getElementById("tile_title_input").value,
            color: document.getElementById("tile_color_input").value,
            ip: document.getElementById("tile_ip_input").value,
            cmd: document.getElementById("tile_cmd_input").value,
        };

        // sync data with a server
        PresetsMgr.saveSelectedPreset();
    }

    static removeSelectedTile() {
        // remove tile item
        PresetsMgr.selected_preset.tiles.splice(TilesGUI.selected_tile_id, 1);

        AppGUI.hideGUI(config_tile);
        AppGUI.showGUI(logs);

        // sync data with a server
        PresetsMgr.saveSelectedPreset();
    }
}

class TilesGUI {
    static current_page = 0;
    static selected_tile_id = 0;
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

    static addTileNode(id, tile_data, on_click) {
        const tile = document.createElement("div");
        tile.classList.add("tile", "tile_btn");
        tile.innerHTML = tile_data.title;
        tile.style.backgroundColor = tile_data.color;

        tiles.insertBefore(tile, document.getElementById("add_tile_btn"));

        tile.onclick = () => {
            if (this.is_hold) return; // do not proceed onclick event of a tile since it has invoked "onhold" event
            on_click();
        }

        tile.onpointerdown = () => {
            AppGUI.hideGUI(presets, config_app, config_tile);
            AppGUI.showGUI(logs);

            this.tile_timeout_handler = setTimeout(() => {
                this.selected_tile_id = id;
                TileConfigGUI.update();
                AnimationMgr.stop(TilesGUI.selected_tile_element, "wiggle");
                TilesGUI.selected_tile_element = tile;
                AnimationMgr.play(TilesGUI.selected_tile_element, "wiggle"); // start wiggle animation since selected
                AppGUI.showGUI(config_tile);
                AppGUI.hideGUI(config_app, logs, presets);

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

        document.getElementById("col_count_text").innerHTML = x;
        document.getElementById("row_count_text").innerHTML = y;

        tiles.style.gridTemplateRows = "";
        tiles.style.gridTemplateColumns = "";

        for (let i = 0; i < y; i++) {
            tiles.style.gridTemplateRows += " 1fr";
        }
        for (let i = 0; i < x; i++) {
            tiles.style.gridTemplateColumns += " 1fr";
        }

        TilesGUI.drawPage();
    }

    static clearTiles() {
        tiles.innerHTML = "";
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
        tiles.appendChild(prev_tile_btn);

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
        tiles.appendChild(add_tile_btn);

        // add new tile to a preset by clicking add tile btn
        add_tile_btn.onclick = () => {
            fetch(`/add_tile`, {
                method: "POST", 
                body: JSON.stringify({
                    chunk_id: localStorage.getItem("chunk_id"),
                    preset_id: localStorage.getItem("preset_id")
                })
            })
            .then(res => { if (res.ok) return res.json(); })
            .then(json => {
                PresetsMgr.selected_preset.tiles.push(json);
                let tile_id = PresetsMgr.selected_preset.tiles.length - 1;
                TilesGUI.addTileNode(tile_id, json, () => {
                    DDVManager.request(json.ip, json.cmd).then(ddv_res => {
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
                DDVManager.request(tile_data.ip, tile_data.cmd).then(ddv_res => {
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

        if (AppGUI.isGUIOpened(config_tile)) {
            AppGUI.hideGUI(config_tile);
            AppGUI.showGUI(logs);
        }
    }
}

class PresetsGUI {
    static is_hold = false;
    static preset_timeout_handler;
    static selected_preset_element;
    static selected_preset_name;

    static addPresetNode(preset_name, on_click) {
        const preset = document.createElement("div");
        preset.classList.add("basic_item", "tile_btn");
        preset.innerHTML = preset_name;

        presets.insertBefore(preset, document.getElementById("add_preset_btn"));

        preset.onclick = (ev) => {
            if (this.is_hold) return; // do not proceed onclick event of a preset since it has invoked "onhold" event
            on_click();
        }

        preset.onpointerdown = () => {
            if (AppGUI.isGUIOpened(config_preset)) {
                AppGUI.hideGUI(config_preset);
                AppGUI.showGridGUI(tiles);
            }

            this.preset_timeout_handler = setTimeout(() => {
                this.selected_preset_name = preset_name;
                PresetConfigGUI.update();
                AnimationMgr.stop(PresetsGUI.selected_preset_element, "wiggle");
                PresetsGUI.selected_preset_element = preset;
                AnimationMgr.play(PresetsGUI.selected_preset_element, "wiggle"); // start wiggle animation since selected
                AppGUI.showGUI(config_preset);
                AppGUI.hideGUI(tiles);

                on_click();

                this.is_hold = true;
            }, 500);
        }
        preset.onpointerleave = () => {
            clearTimeout(PresetsGUI.preset_timeout_handler);
            setTimeout(() => {
                PresetsGUI.is_hold = false;
            }, 10);
        }

        return preset;
    }

    static onPresetSelected(preset_node) {
        // update selected preset id
        localStorage.setItem("preset_id", preset_node.innerHTML);
        PresetsMgr.loadSelectedPreset();
    }

    static clearPresets() {
        presets.innerHTML = "";
    }

    /** visualizes which preset is selected in presets gui */
    static updateSelectedPreset() {
        for (let child of presets.children) {
            if (child.innerHTML == localStorage.getItem("preset_id")) {
                child.style.opacity = "1";
            }
            else if (child.id != "add_preset_btn") {
                child.style.opacity = ".5";
            }
        }
    }
}

class PresetConfigGUI {
    static config_items = {
        preset_name: {
            item: {
                preset_name_input: {
                    type: "input",
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
                    on_click: this.saveSelectedPresetName
                },
            },
            preset_remove: {
                preset_remove_btn: {
                    type: "btn",
                    text: "Remove",
                    input_to_tile: true,
                    outlined: true,
                    color: "#f77",
                    on_click: this.removeSelectedPreset
                },
            }
        },
    }
    static update() {
        document.getElementById("preset_name_input").value = PresetsGUI.selected_preset_name;
    }

    static saveSelectedPresetName() {
        fetch(`/update_preset_name`, {
            method: "POST", 
            body: JSON.stringify({
                chunk_id: localStorage.getItem("chunk_id"),
                preset_id: localStorage.getItem("preset_id"),
                data: document.getElementById("preset_name_input").value
            })
        })
        .then(res => {
            if (res.ok) {
                AppGUI.showResponseIndicator();
                localStorage.setItem("preset_id", document.getElementById("preset_name_input").value);

                AppGUI.hideGUI(config_preset);
                AppGUI.showGridGUI(tiles);

                PresetsMgr.fetchPresets();
                PresetsMgr.loadSelectedPreset();
            }
            else {
                AppGUI.showResponseIndicator(true);
            }
        });
    }
    static removeSelectedPreset() {
        fetch(`/remove_preset`, {
            method: "POST", 
            body: JSON.stringify({
                chunk_id: localStorage.getItem("chunk_id"),
                preset_id: localStorage.getItem("preset_id")
            })
        })
        .then(res => { 
            if (res.ok) {
                if (localStorage.getItem("preset_id") == PresetsGUI.selected_preset_name) {
                    localStorage.removeItem("preset_id");
                    TilesGUI.clearTiles();
                }

                presets.removeChild(PresetsGUI.selected_preset_element);
                PresetsGUI.selected_preset_name = null;

                AppGUI.hideGUI(config_preset);
                AppGUI.showGridGUI(tiles);

                AppGUI.showResponseIndicator();
                PresetsMgr.fetchPresets();
            }
        });
    }
}

class PresetsMgr {
    static selected_preset = {}

    static loadSelectedPreset() {
        if (!localStorage.getItem("preset_id")) {
            return;
        }

        // load preset
        fetch(`/get_preset_data`, {
            method: "POST", 
            body: JSON.stringify({
                chunk_id: localStorage.getItem("chunk_id"),
                preset_id: localStorage.getItem("preset_id")
            })
        })
        .then(res => { if (res.ok) return res.json(); })
        .then(json => {
            if (!json) return;

            PresetsMgr.selected_preset = json; // store for later
            TilesGUI.current_page = 0; // reset tiles page

            // ...received preset data

            TilesGUI.drawPage(); // draw page of preset tiles in tiles gui
            PresetsGUI.updateSelectedPreset(); // update preset selected state
            AppGUI.showResponseIndicator(); // show respone indicator to determine server responded OK
        });
    }

    static saveSelectedPreset() {
        // sync data with server
        fetch(`/save_preset_data`, {
            method: "POST", 
            body: JSON.stringify({
                chunk_id: localStorage.getItem("chunk_id"),
                preset_id: localStorage.getItem("preset_id"),
                data: PresetsMgr.selected_preset
            })
        })
        .then(res => { 
            if (res.ok) {
                AppGUI.showResponseIndicator();
                TilesGUI.drawPage();
            }
        });
    }

    static fetchPresets() {
        // get list of all presets related to a selected chunk
        fetch('/get_presets', { 
            method: "POST", 
            body: JSON.stringify({
                chunk_id: localStorage.getItem("chunk_id")
            })
        })
        .then(res => { if (res.ok) return res.json(); })
        .then(json => {
            if (!json) return;

            // ...received presets list

            // clear old presets gui
            PresetsGUI.clearPresets();

            let add_preset_btn = document.createElement("div");
            add_preset_btn.classList.add("basic_item", "basic_item_icon", "tile_btn");
            add_preset_btn.id = "add_preset_btn";
            add_preset_btn.style.backgroundImage = `url("/assets/plus.svg")`;
            presets.appendChild(add_preset_btn);

            add_preset_btn.onclick = () => {
                fetch(`/add_preset`, {
                    method: "POST", 
                    body: JSON.stringify({
                        chunk_id: localStorage.getItem("chunk_id")
                    })
                })
                .then(res => { if (res.ok) return res.json(); })
                .then(json => {
                    let preset_node = PresetsGUI.addPresetNode(json.title, () => {
                        PresetsGUI.onPresetSelected(preset_node);
                    });
                    // select preset right after created
                    PresetsGUI.onPresetSelected(preset_node);
                    AppGUI.showResponseIndicator();

                    AppGUI.hideGUI(config_preset);
                    AppGUI.showGridGUI(tiles);

                    presets.scrollBy(0, presets.scrollHeight);
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

class AppGUI {
    static #response_indicator_timeout;
    static showResponseIndicator(negative = false) {
        clearTimeout(this.#response_indicator_timeout);
        
        let response_indicator = document.getElementById("response_indicator");
        response_indicator.style.transition = "all 0ms";
        response_indicator.style.opacity = 1;
        response_indicator.offsetWidth;

        if (negative) {
            response_indicator.style.backgroundColor = "#F77";
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
        document.body.style.width = layout_state == 1 ? "100vw" : "calc(100vw - 1rem)";
        document.body.style.height = layout_state == 1 ? "calc(100dvh - 1rem)" : "100dvh";
        document.body.style.minHeight = layout_state == 1 ? "calc(100dvh - 1rem)" : "100dvh";
    }

    static showGridGUI(...elements) {
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.display = "grid";
        }
    }

    static showGUI(...elements) {
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.display = "flex";

            if (elements[i] == config_app) {
                config_app_nav_btn.style.backgroundImage = `url("/assets/cross.svg")`;
                AnimationMgr.stop(chunk_id_input, "error_impact");
            }
            if (elements[i] == presets) {
                presets_nav_btn.style.backgroundImage = `url("/assets/cross.svg")`;
            }
            if (elements[i] == config_tile) {
                document.getElementById("area_A_navbar").style.display = "none";
            }
            if (elements[i] == config_preset) {
                document.getElementById("area_A_navbar").style.display = "none";
            }
        }
    }

    static hideGUI(...elements) {
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.display = "none";

            if (elements[i] == config_app) {
                config_app_nav_btn.style.backgroundImage = `url("/assets/gear.svg")`;
            }
            if (elements[i] == presets) {
                presets_nav_btn.style.backgroundImage = `url("/assets/presets.svg")`;
            }
            if (elements[i] == config_tile) {
                // stop wiggle animation since tile should be visually "disselected"
                AnimationMgr.stop(TilesGUI.selected_tile_element, "wiggle");
                TilesGUI.selected_tile_element = null;
                document.getElementById("area_A_navbar").style.display = "flex";
            }
            if (elements[i] == config_preset) {
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

class StorageMgr {
    static trySetDefatuls() {
        if (!localStorage.getItem("grid_x") || !localStorage.getItem("grid_y")) {
            localStorage.setItem("grid_x", 3);
            localStorage.setItem("grid_y", 3);
        }

        if (!localStorage.getItem("chunk_id")) {
            AppConfigMgr.genChunkID();
            AppConfigMgr.syncChunkID();
        }

        if (!localStorage.getItem("layout_state")) {
            localStorage.setItem("layout_state", 0);
            AppGUI.updateLayout();
        }
    }

    static addRow() {
        let y = localStorage.getItem("grid_y");
        y++;
        localStorage.setItem("grid_y", y);

        TilesGUI.updateGrid();
    };
    static removeRow() {
        let y = localStorage.getItem("grid_y");
        y = y > 2 ? y - 1 : 2;
        localStorage.setItem("grid_y", y);

        TilesGUI.updateGrid();
    };

    static addColumn() {
        let x = localStorage.getItem("grid_x");
        x++;
        localStorage.setItem("grid_x", x);

        TilesGUI.updateGrid();
    };
    static removeColumn() {
        let x = localStorage.getItem("grid_x");
        x = x > 2 ? x - 1 : 2;
        localStorage.setItem("grid_x", x);

        TilesGUI.updateGrid();
    };

    static switchLayout() {
        // true - vertical, false - horizontal
        localStorage.setItem("layout_state", localStorage.getItem("layout_state") == 1 ? 0 : 1);
        AppConfigGUI.update();
        AppGUI.updateLayout();
    }
}

class AppConfigMgr {
    static genRndStr() {
        return (Math.random() + 1).toString(16).substring(2);
    }

    /** updates chunk id local storage value and fetches presets data right after. */
    static syncChunkID() {
        let chunk_id_input = document.getElementById("chunk_id_input");
        if (chunk_id_input.value == "") {
            AnimationMgr.stop(chunk_id_input, "error_impact");
            AnimationMgr.play(chunk_id_input, "error_impact");
            return;
        }

        localStorage.setItem("chunk_id", chunk_id_input.value);
        localStorage.removeItem("preset_id");

        PresetsGUI.clearPresets();
        TilesGUI.clearTiles();
        PresetsMgr.fetchPresets();

        AppGUI.hideGUI(config_app, logs);
        AppGUI.showGUI(presets);
    }

    /** updates chunk id filed value but DOES NOT sync it with actual local storage value. */
    static genChunkID() {
        let chunk_id_input = document.getElementById("chunk_id_input");
        chunk_id_input.value = `${AppConfigMgr.genRndStr()}${AppConfigMgr.genRndStr()}`;
    }
}

class AppConfigGUI {
    static config_items = {
        rows: {
            tile_title: {
                rows_title: {
                    type: "text",
                    text: "Rows",
                    backgroundColor: "#333"
                },
            },
            tile_items: {
                rem_row_btn: {
                    type: "btn",
                    icon: "/assets/arrow_l.svg",
                    on_click: StorageMgr.removeRow
                },
                row_count_text: {
                    type: "text",
                    text: "0"
                },
                add_row_btn: {
                    type: "btn",
                    icon: "/assets/arrow_r.svg",
                    on_click: StorageMgr.addRow
                },
            }
            
        },
        cols: {
            tile_title: {
                rows_title: {
                    type: "text",
                    text: "Columns",
                    backgroundColor: "#333"
                },
            },
            tile_items: {
                rem_col_btn: {
                    type: "btn",
                    icon: "/assets/arrow_l.svg",
                    on_click: StorageMgr.removeColumn
                },
                col_count_text: {
                    type: "text",
                    text: "0"
                },
                add_col_btn: {
                    type: "btn",
                    icon: "/assets/arrow_r.svg",
                    on_click: StorageMgr.addColumn
                },
            }
        },
        layout_state: {
            tile_title: {
                rows_title: {
                    type: "text",
                    text: "Layout",
                    backgroundColor: "#333"
                },
            },
            tile_items: {
                layout_state_btn: {
                    type: "btn",
                    input_to_tile: true,
                    text: "None",
                    on_click: StorageMgr.switchLayout
                },
            }
        },
        chunk_id: {
            tile_item: {
                chunk_id_input: {
                    type: "input",
                    placeholder: "Chunk ID",
                    on_submit: () => {
                        document.getElementById("chunk_id_input").blur();
                    }
                },
            }
        },

        chunk_id_controls: {
            tile_0: {
                chunk_id_gen_btn: {
                    type: "btn",
                    input_to_tile: true,
                    icon: "/assets/dice.svg",
                    on_click: AppConfigMgr.genChunkID
                },
            },
            tile_1: {
                chunk_id_sync_btn: {
                    type: "btn",
                    input_to_tile: true,
                    // icon: "/assets/refresh.svg",
                    text: "Sync",
                    outlined: true,
                    color: "#FD6",
                    on_click: AppConfigMgr.syncChunkID
                },
            }
        },
    };

    /** updates elements' values in app config gui. */
    static update() {
        let layout_state = localStorage.getItem("layout_state");
        let layout_state_btn = document.getElementById("layout_state_btn");
        layout_state_btn.innerHTML = layout_state == 1 ? "Vertical" : "Horizontal";
        layout_state_btn.parentElement.style.backgroundColor = layout_state == 1 ? "#b83" : "#648";

        document.getElementById("col_count_text").value = localStorage.getItem("grid_x");
        document.getElementById("row_count_text").value = localStorage.getItem("grid_y");

        chunk_id_input.value = localStorage.getItem("chunk_id");
    }
}

class LayoutBuilder {
    /** creates elements inside `parent_element` for configuration GUIs
     * according to `reference_table`. */
    static createLayoutItems(reference_table, parent_element) {
        for (let ci_key in reference_table) {
            // rows {}, cols {}, ...
            let config_item = reference_table[ci_key];

            let list_element_root = document.createElement("div");
            list_element_root.classList.add("list_element_root", "basic_item");

            for (let tile_key in config_item) {
                // tile_title {}, tile_items {}, ...
                let tile = config_item[tile_key];

                let tile_element = document.createElement("div");
                tile_element.classList.add("tile");
                list_element_root.appendChild(tile_element);

                for (let item_key in tile) {
                    let item = tile[item_key];

                    if (item.type == "text") {
                        let text_element = document.createElement("div");
                        text_element.id = item_key;
                        text_element.innerHTML = item.text;
                        tile_element.appendChild(text_element);

                        if (item.backgroundColor) {
                            tile_element.style.backgroundColor = item.backgroundColor;
                        }
                    }

                    if (item.type == "input") {
                        let input_element = document.createElement("input");
                        input_element.id = item_key;
                        input_element.type = "text";
                        input_element.placeholder = item.placeholder;
                        list_element_root.style.gridTemplateColumns = "1fr";
                        tile_element.appendChild(input_element);
                        input_element.onkeyup = (ev) => {
                            if (item.on_submit && ev.key === "Enter" && !ev.isComposing) {
                                item.on_submit(ev);
                            }
                        }
                    }

                    if (item.type == "btn") {
                        let btn_element = document.createElement("div");
                        btn_element.id = item_key;

                        if (item.icon) {
                            btn_element.style.backgroundImage = `url("${item.icon}")`;
                            btn_element.classList.add("btn_icon");
                        }

                        if (item.text) {
                            btn_element.innerHTML = item.text;
                        }

                        if (item.outlined) {
                            tile_element.style.border = `.2rem solid #444`;
                        }

                        if (item.color) {
                            tile_element.style.backgroundColor = !item.outlined ? item.color : "transparent";
                            tile_element.style.color = item.outlined ? item.color : "unset";
                            tile_element.style.borderColor = item.color;
                        }

                        if (item.input_to_tile) {
                            tile_element.onclick = () => { item.on_click(); };
                            tile_element.classList.add("tile_btn");
                        }
                        else {
                            btn_element.onclick = () => { item.on_click(); };
                        }
                        
                        tile_element.appendChild(btn_element);
                    }
                }
            }

            parent_element.appendChild(list_element_root);
        }
    }
}

class AnimationMgr {
    static play(element, animation_class_name) {
        if (!element) return;
        element.offsetWidth;
        element.classList.add(animation_class_name);
    }
    static stop(element, animation_class_name) {
        if (!element) return;
        element.classList.remove(animation_class_name);
        element.offsetWidth;
    }
}

class LogsGUI {
    static getTime() {
        let date = new Date();
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toUTCString().substring(17, 25);
    }
    static printReqMessage(ip, message) {
        logs.innerHTML += `<span style="color:#FD6">[${this.getTime()} REQ ${ip}]</span>${message}\n`;
        logs.scrollBy(0, logs.scrollHeight);
    }
    static printResMessage(ip, message) {
        message = message.replace(/\n/g, ''); // remove new line in the end if exist (ddv sends it in response)
        logs.innerHTML += `<span style="color:#9F6">[${this.getTime()} RES ${ip}]</span>${message}\n`;
        logs.scrollBy(0, logs.scrollHeight);
    }
    static printErrMessage(ip, message) {
        logs.innerHTML += `<span style="color:#F77">[${this.getTime()} ERR ${ip}]</span>${message}\n`;
        logs.scrollBy(0, logs.scrollHeight);
    }
    static printMessage(message) {
        logs.innerHTML += `<span style="color:#888">${message}</span>\n`;
        logs.scrollBy(0, logs.scrollHeight);
    }
}

class DDVManager {
    static validateIP(ip) {
        let ip_array = ip.split(".");
        if (ip_array.length != 4) return false;

        for (let i = 0; i < ip_array.length; i++) {
            let seg = parseInt(ip_array[i]);
            if (isNaN(seg)) return false;
            if (seg > 255 || seg < 0) return false;
        }

        return true;
    }
    static validateCmd(cmd) {
        return cmd.startsWith("!");
    }
    /** Sends command request to a ddv. `ip` - dethings device ip address, `cmd` - !command to send. 
     * Returns device response as a plain text.
    */
    static async request(ip, cmd) {
        let result;
        let failed = false;

        if (!this.validateIP(ip)) {
            LogsGUI.printMessage("IP Address is invalid. Valid example: '192.168.88.128'");
            return result;
        }

        if (!this.validateCmd(cmd)) {
            LogsGUI.printMessage("Tile command is invalid. Valid example: '!my_command'");
            return result;
        }

        LogsGUI.printReqMessage(ip, cmd);

        let res = await fetch("/api", { 
            method: "POST",
            body: JSON.stringify({ ip, cmd }),
            headers: {
                "Content-Type": "application/json"
            }
        }).catch(e => { console.error(e); failed = true; });

        failed = !res.ok;

        if (!failed) {
            result = await res.text();
        }
        else {
            LogsGUI.printErrMessage(ip, "No response");
        }

        return result;
    }
}

class App {
    static init() {
        LayoutBuilder.createLayoutItems(AppConfigGUI.config_items, config_app);
        LayoutBuilder.createLayoutItems(TileConfigGUI.config_items, config_tile);
        LayoutBuilder.createLayoutItems(PresetConfigGUI.config_items, config_preset);

        StorageMgr.trySetDefatuls();
        
        TilesGUI.updateGrid();
        PresetsMgr.fetchPresets();
        PresetsMgr.loadSelectedPreset();

        AppGUI.updateLayout();

        NavbarGUI.init();

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

App.init();