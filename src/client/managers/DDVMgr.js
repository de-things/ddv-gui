
import { LogsGUI } from "../gui/LogsGUI.js"
import { CryptoMgr } from "./CryptoMgr.js"
import { App } from "../env/App.js"

/** dethings device manager to work with ddv requests. */
export class DDVMgr {
    /** Sends command request to a ddv. `ip` - dethings device ip address, `cmd` - !command to send. 
     * Returns device response as a plain text.
    */
    static async request(ip, cmd, secret) {
        let result;
        let failed = false;

        if (!App.validateIP(ip)) {
            LogsGUI.printMessage("Specified IP address is invalid.");
            LogsGUI.printMessage("IPv4 Example: '192.168.88.128'.");
            LogsGUI.printMessage("IPv6 Example: '2001:db8::ff00:42:8329'.");
            LogsGUI.printMessage("Tip: Hold tile to edit it's data.");
            return result;
        }

        if (!App.validateCmd(cmd)) {
            LogsGUI.printMessage("Specified command is invalid.");
            LogsGUI.printMessage("Expected: <string>.");
            return result;
        }
        
        if (!App.validateSecret(secret)) {
            LogsGUI.printMessage("Tile private key (secret) is invalid.");
            LogsGUI.printMessage("Expected: <32-byte string>.");
            return result;
        }

        LogsGUI.printReqMessage(ip, cmd);

        let enc_cmd = await CryptoMgr.encrypt(cmd, secret);

        let res = await fetch("/api", { 
            method: "POST",
            body: await CryptoMgr.encrypt(JSON.stringify({ ip, enc_cmd }), localStorage.getItem("server_secret")),
        })
        .catch(e => { console.error(e); failed = true; });

        failed = !res.ok;

        if (!failed) {
            result = await res.text();
            let dec_data = await CryptoMgr.decrypt(result, secret);
            if (dec_data) result = dec_data;
        }
        else {
            LogsGUI.printErrMessage(ip, "No response");
        }

        return result;
    }
}