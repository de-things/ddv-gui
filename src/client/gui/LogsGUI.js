import * as Layout from "../env/Layout.js"

export class LogsGUI {
    static #addSpan(text_content, color = "#FFF") {
        const span = document.createElement("span");
        span.style.color = color;
        span.textContent = text_content;
        Layout.logs.appendChild(span);
        Layout.logs.scrollBy(0, logs.scrollHeight);
    }
    static getTime() {
        let date = new Date();
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toUTCString().substring(17, 25);
    }
    static printReqMessage(ip, message) {
        this.#addSpan(`[${this.getTime()} REQ ${ip}]`, "#FD6");
        this.#addSpan(message);
    }
    static printResMessage(ip, message) {
        this.#addSpan(`[${this.getTime()} RES ${ip}]`, "#9F6");
        this.#addSpan(message.trim());
    }
    static printErrMessage(ip, message) {
        this.#addSpan(`[${this.getTime()} ERR ${ip}]`, "#F77");
        this.#addSpan(message);
    }
    static printMessage(message) {
        this.#addSpan(message, "#888");
    }
}