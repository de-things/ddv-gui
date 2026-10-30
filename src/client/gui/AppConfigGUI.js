import { StorageMgr } from "../managers/StorageMgr.js"
import { AnimationMgr } from "../managers/AnimationMgr.js"
import { AppConfigMgr } from "../managers/AppConfigMgr.js"
import { AppGUI } from "./AppGUI.js"
import { QRGUI } from "./QRGUI.js"
import * as Layout from "../env/Layout.js";
import { App } from "../env/App.js"

export class AppConfigGUI {
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
                    on_click: () => {
                        let parent = document.getElementById("add_row_btn").parentElement;
                        AnimationMgr.stop(parent, "translateXp");
                        AnimationMgr.stop(parent, "translateXn");
                        AnimationMgr.play(parent, "translateXn");
                        StorageMgr.removeRow();
                    }
                },
                row_count_text: {
                    type: "text",
                    text: "0",
                    bold: true
                },
                add_row_btn: {
                    type: "btn",
                    icon: "/assets/arrow_r.svg",
                    on_click: () => {
                        let parent = document.getElementById("add_row_btn").parentElement;
                        AnimationMgr.stop(parent, "translateXp");
                        AnimationMgr.stop(parent, "translateXn");
                        AnimationMgr.play(parent, "translateXp");
                        StorageMgr.addRow();
                    }
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
                    on_click: () => {
                        let parent = document.getElementById("rem_col_btn").parentElement;
                        AnimationMgr.stop(parent, "translateXp");
                        AnimationMgr.stop(parent, "translateXn");
                        AnimationMgr.play(parent, "translateXn");
                        StorageMgr.removeColumn();
                    }
                },
                col_count_text: {
                    type: "text",
                    text: "0",
                    bold: true
                },
                add_col_btn: {
                    type: "btn",
                    icon: "/assets/arrow_r.svg",
                    on_click: () => {
                        let parent = document.getElementById("add_col_btn").parentElement;
                        AnimationMgr.stop(parent, "translateXp");
                        AnimationMgr.stop(parent, "translateXn");
                        AnimationMgr.play(parent, "translateXp");
                        StorageMgr.addColumn();
                    }
                },
            }
        },
        font_size: {
            tile_title: {
                rows_title: {
                    type: "text",
                    text: "Font size",
                    backgroundColor: "#333"
                },
            },
            tile_items: {
                red_font_size_btn: {
                    type: "btn",
                    icon: "/assets/arrow_l.svg",
                    on_click: () => {
                        let parent = document.getElementById("red_font_size_btn").parentElement;
                        AnimationMgr.stop(parent, "translateXp");
                        AnimationMgr.stop(parent, "translateXn");
                        AnimationMgr.play(parent, "translateXn");
                        StorageMgr.decreaseFontSize();
                    }
                },
                font_size_text: {
                    type: "text",
                    text: "0",
                    bold: true
                },
                inc_font_size_btn: {
                    type: "btn",
                    icon: "/assets/arrow_r.svg",
                    on_click: () => {
                        let parent = document.getElementById("inc_font_size_btn").parentElement;
                        AnimationMgr.stop(parent, "translateXp");
                        AnimationMgr.stop(parent, "translateXn");
                        AnimationMgr.play(parent, "translateXp");
                        StorageMgr.increaseFontSize();
                    }
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
                    on_click: StorageMgr.switchLayoutState
                },
            }
        },
        server_secret: {
            tile_item: {
                server_secret_input: {
                    type: "input",
                    stretched: true,
                    private: true,
                    placeholder: "Access key (32-bytes)",
                    on_submit: () => {
                        document.getElementById("server_secret_input").blur();
                    }
                },
            }
        },

        server_secret_controls: {
            tile_0: {
                server_secret_share_btn: {
                    type: "btn",
                    input_to_tile: true,
                    icon: "/assets/scan.svg",
                    on_click: this.tryOpenQRGUI
                },
            },
            tile_1: {
                server_secret_sync_btn: {
                    type: "btn",
                    input_to_tile: true,
                    text: "Sync",
                    outlined: true,
                    color: "#FF5",
                    on_click: AppConfigMgr.syncServerSecretID
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

        document.getElementById("col_count_text").innerHTML = localStorage.getItem("grid_x");
        document.getElementById("row_count_text").innerHTML = localStorage.getItem("grid_y");

        let font_size_text = document.getElementById("font_size_text");
        let font_size = parseInt(localStorage.getItem("font_size"));

        if (font_size <= 10) {
           font_size_text.innerHTML = "S";
        }
        else if (font_size <= 15) {
           font_size_text.innerHTML = "M";
        }
        else if (font_size <= 20) {
           font_size_text.innerHTML = "L";
        }
        
        document.getElementById("server_secret_input").value = App.server_secret();
    }

    static tryOpenQRGUI() {
        let server_secret_input = document.getElementById("server_secret_input");
        let server_secret_sync_btn = document.getElementById("server_secret_sync_btn");
        if (server_secret_input.value == "") {
            AnimationMgr.stop(server_secret_input, "error_impact");
            AnimationMgr.play(server_secret_input, "error_impact");
            return;
        }
        else if (!App.server_secret() || server_secret_input.value != App.server_secret()) {
            AnimationMgr.stop(server_secret_sync_btn.parentElement, "error_impact_alt");
            AnimationMgr.play(server_secret_sync_btn.parentElement, "error_impact_alt");
            return;
        }

        AppConfigGUI.update();
        AppGUI.showGUI(Layout.qr_gui);
        QRGUI.createQR(server_secret_input.value);
    }
}