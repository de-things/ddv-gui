import { AppGUI } from "../gui/AppGUI.js"
import { AppConfigGUI } from "../gui/AppConfigGUI.js"
import { TilesGUI } from "../gui/TilesGUI.js"

export class StorageMgr {
    static trySetDefatuls() {
        if (!localStorage.getItem("grid_x") || !localStorage.getItem("grid_y")) {
            localStorage.setItem("grid_x", 3);
            localStorage.setItem("grid_y", 3);
        }

        if (!localStorage.getItem("layout_state")) {
            localStorage.setItem("layout_state", 0);
            AppGUI.updateLayout();
        }

        if (!localStorage.getItem("font_size")) {
            localStorage.setItem("font_size", 15);
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

    static switchLayoutState() {
        // 1 - vertical, 0 - horizontal
        localStorage.setItem("layout_state", localStorage.getItem("layout_state") == 1 ? 0 : 1);
        AppConfigGUI.update();
        AppGUI.updateLayout();
    }

    static increaseFontSize() {
        let old_size = parseInt(localStorage.getItem("font_size"));
        if (old_size < 10) {
            localStorage.setItem("font_size", 10);
        }
        else if (old_size < 15) {
            localStorage.setItem("font_size", 15);
        }
        else if (old_size < 20) {
            localStorage.setItem("font_size", 20);
        }
        
        AppConfigGUI.update();
        AppGUI.updateLayout();
    }
    static decreaseFontSize() {
        let old_size = parseInt(localStorage.getItem("font_size"));
        if (old_size > 20) {
            localStorage.setItem("font_size", 20);
        }
        else if (old_size > 15) {
            localStorage.setItem("font_size", 15);
        }
        else if (old_size > 10) {
            localStorage.setItem("font_size", 10);
        }
        AppConfigGUI.update();
        AppGUI.updateLayout();
    }
}