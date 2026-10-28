
import { TilesGUI } from "./TilesGUI.js"
import { AppGUI } from "./AppGUI.js"
import { PresetsMgr } from "../managers/PresetsMgr.js"
import * as Layout from "../env/Layout.js"

export class TileConfigGUI {
    static config_items = {
        // different tile types are barely designed,
        // so it's disabled for now
        // type: {
        //     tile_0: {
        //         tile_type_btn_title: {
        //             type: "text",
        //             text: "Type",
        //             backgroundColor: "#333"
        //         },
        //     },
        //     tile_1: {
        //         tile_type_btn: {
        //             type: "btn",
        //             input_to_tile: true,
        //             text: "A",
        //             on_click: () => { /** change tile type */ }
        //         },
        //     }
        // },
        title: {
            tile_item: {
                tile_title_input: {
                    type: "input",
                    stretched: true,
                    placeholder: "Title",
                    on_submit: () => {
                        document.getElementById("tile_ip_input").focus();
                    }
                },
            }
        },
        color: {
            tile_0: {
                tile_color_text: {
                    type: "text",
                    text: "Color",
                    backgroundColor: "#333"
                },
            },
            tile_1: {
                tile_color_input: {
                    type: "color"
                },
            }
        },
        ip: {
            tile_item: {
                tile_ip_input: {
                    type: "input",
                    stretched: true,
                    placeholder: "Address (IPv4/IPv6)",
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
                    stretched: true,
                    placeholder: "Request command",
                    on_submit: () => {
                        document.getElementById("tile_secret_input").focus();
                    }
                },
            }
        },
        secret: {
            tile_item: {
                tile_secret_input: {
                    type: "input",
                    stretched: true,
                    private: true,
                    placeholder: "Private key (32-bytes)",
                    on_submit: () => {
                        document.getElementById("tile_secret_input").blur();
                        Layout.config_tile.scrollBy(0, Layout.config_tile.scrollHeight);
                    }
                },
            }
        },
        tile_save_clone_area: {
            tile_0: {
                tile_save_btn: {
                    type: "btn",
                    text: "Save",
                    input_to_tile: true,
                    on_click: this.saveSelectedTile
                },
            },
            tile_1: {
                tile_clone_btn: {
                    type: "btn",
                    // text: "Clone",
                    icon: "/assets/copy.svg",
                    input_to_tile: true,
                    on_click: this.cloneSelectedTile
                },
            },
        },
        tile_remove_area: {
            tile_0: {
                tile_remove_btn: {
                    type: "btn",
                    text: "Remove",
                    input_to_tile: true,
                    stretched: true,
                    outlined: true,
                    color: "#D45",
                    on_click: this.removeSelectedTile
                },
            }
        },
    };

    /** Updates elements' content in tiles config gui. */
    static update() {
        let tile_instance = PresetsMgr.selected_preset.tiles[TilesGUI.selected_tile_index];
        document.getElementById("tile_title_input").value = tile_instance.title;

        document.getElementById("tile_color_input").value = tile_instance.color;
        document.getElementById("tile_color_input").parentElement.style.backgroundColor = tile_instance.color;

        document.getElementById("tile_ip_input").value = tile_instance.ip;
        document.getElementById("tile_cmd_input").value = tile_instance.cmd;
        document.getElementById("tile_secret_input").value = tile_instance.secret;
    }

    /** clones selected tile (uses properties determined in gui, not values from preset) */
    static cloneSelectedTile() {
        PresetsMgr.selected_preset.tiles.splice(TilesGUI.selected_tile_index + 1, 0, {
            title: document.getElementById("tile_title_input").value,
            color: document.getElementById("tile_color_input").value,
            ip: document.getElementById("tile_ip_input").value,
            cmd: document.getElementById("tile_cmd_input").value,
            secret: document.getElementById("tile_secret_input").value,
        });

        // sync data with a server
        PresetsMgr.saveSelectedPreset();
    }

    static saveSelectedTile() {
        // save changes into preset obj
        PresetsMgr.selected_preset.tiles[TilesGUI.selected_tile_index] = {
            title: document.getElementById("tile_title_input").value,
            color: document.getElementById("tile_color_input").value,
            ip: document.getElementById("tile_ip_input").value,
            cmd: document.getElementById("tile_cmd_input").value,
            secret: document.getElementById("tile_secret_input").value,
        };

        // sync data with a server
        PresetsMgr.saveSelectedPreset();
    }

    static removeSelectedTile() {
        // remove tile item
        PresetsMgr.selected_preset.tiles.splice(TilesGUI.selected_tile_index, 1);

        AppGUI.hideGUI(Layout.config_tile);
        AppGUI.showGUI(Layout.logs);

        // sync data with a server
        PresetsMgr.saveSelectedPreset();
    }
}