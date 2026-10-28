import { AppGUI } from "./AppGUI.js"
import { QRCode } from "../libs/qrcode.min.js"
import * as Layout from "../env/Layout.js"

export class QRGUI {
    static init() {
        let qr_gui_close_btn = document.getElementById("qr_gui_close_btn");
        qr_gui_close_btn.onclick = () => {
            AppGUI.hideGUI(Layout.qr_gui);
        }
    }

    static createQR(text) {
        const qr_secret_text = document.getElementById("qr_secret_text");
        const qr_secret = document.getElementById("qr_secret");
        qr_secret.innerHTML = ""; // clear old qr data

        const rem = parseInt(getComputedStyle(document.documentElement).fontSize); // returns 1 rem in px

        qr_secret_text.innerHTML = text;

        new QRCode(qr_secret, { // place new qr
            text,
            width: qr_secret.clientWidth,
            height: qr_secret.clientWidth
        });
    }
}