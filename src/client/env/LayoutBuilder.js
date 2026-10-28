import { App } from "./App.js"

export class LayoutBuilder {
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

                    if (item.stretched) {
                        list_element_root.style.gridTemplateColumns = "1fr";
                    }

                    if (item.type == "text") {
                        let text_element = document.createElement("div");
                        text_element.id = item_key;
                        text_element.innerHTML = item.text;
                        tile_element.appendChild(text_element);

                        if (item.backgroundColor) {
                            tile_element.style.backgroundColor = item.backgroundColor;
                        }

                        if (item.bold) {
                            tile_element.style.fontFamily = "os_bold";
                        }
                    }

                    if (item.type == "input") {
                        let input_element = document.createElement("input");
                        input_element.id = item_key;
                        input_element.type = item.private ? "password" : "text";
                        input_element.placeholder = item.placeholder;
                        tile_element.appendChild(input_element);
                        input_element.onkeyup = (ev) => {
                            if (item.on_submit && ev.key === "Enter" && !ev.isComposing) {
                                item.on_submit(ev);
                            }
                        }

                        if (item.private) {
                            input_element.onfocus = () => {
                                input_element.type = "text";
                            }
                            input_element.onblur = () => {
                                input_element.type = "password";
                            }
                        }
                    }
                    
                    if (item.type == "color") {
                        let color_element = document.createElement("input");
                        color_element.id = item_key;
                        color_element.type = "color";
                        tile_element.appendChild(color_element);
                        color_element.style.display = "none";

                        tile_element.onclick = () => {
                            color_element.click();
                        }

                        color_element.onchange = (ev) => {
                            if (item.on_submit) {
                                item.on_submit(ev);
                            }
                            tile_element.style.backgroundColor = color_element.value;
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
                            tile_element.style.color = item.outlined ? item.color : App.getTextColor(item.color);
                            if (item.outlined) {
                                tile_element.style.borderColor = item.color;
                            }
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