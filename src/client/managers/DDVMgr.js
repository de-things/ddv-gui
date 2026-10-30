import { DelibAPI } from "../libs/delib/index.js"
import { LogsGUI } from "../gui/LogsGUI.js"
import { App } from "../env/App.js"

/** dethings device manager to work with ddv requests. */
export class DDVMgr {
    static async request(ip, secret_str, data) {
        let result;
        let failed = false;

        if (!DelibAPI.validateIP(ip)) {
            LogsGUI.printMessage("Specified IP address is invalid.");
            LogsGUI.printMessage("IPv4 Example: '192.168.88.128'.");
            LogsGUI.printMessage("IPv6 Example: '2001:db8::ff00:42:8329'.");
            LogsGUI.printMessage("Tip: Hold tile to edit it's data.");
            return;
        }

        if (!DelibAPI.validateData(data)) {
            LogsGUI.printMessage("Specified data is invalid.");
            LogsGUI.printMessage("Expected: <string>.");
            return;
        }
        
        if (!DelibAPI.validateSecret(secret_str)) {
            LogsGUI.printMessage("Tile private key (secret) is invalid.");
            LogsGUI.printMessage("Expected: <32-byte string>.");
            console.log(secret_str, new TextEncoder().encode(secret_str).length)
            return;
        }

        LogsGUI.printReqMessage(ip, data);

        let enc_data = await DelibAPI.encrypt(data, secret_str);

        // send request to a backend /api with device data
        let response = await DelibAPI.request(`/api`, 
            App.server_secret(), JSON.stringify({ ip, enc_data }))

        if (!response) {
            LogsGUI.printErrMessage(ip, "No response");
            return;
        }

        return await DelibAPI.decrypt(response, secret_str);
    }
}