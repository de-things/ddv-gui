import crypto from "crypto";
import * as ConfigMgr from "./ConfigMgr.js";

/** encrypts data using aes-256-gcm. 
 *  `data` - string data to encrypt;
*/
export function encrypt(data) {
    const iv = crypto.randomBytes(12);
    const secret_buffer = Buffer.from(ConfigMgr.secret(), "utf8");

    const cipher = crypto.createCipheriv("aes-256-gcm", secret_buffer, iv, {
        authTagLength: 16,
    });

    const ciphertext = Buffer.concat([
        cipher.update(Buffer.from(data, "utf8")),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, ciphertext, tag]).toString("base64");
}

/** decrypts data using aes-256-gcm. 
 * `enc_base64` - encrypted data as a base64 string.
*/
export function decrypt(enc_base64) {
    const data = Buffer.from(enc_base64, "base64");
    const iv_len = 12;
    const tag_len = 16;

    if (data.length < iv_len + tag_len) {
        return false;
    }

    const iv = data.subarray(0, iv_len);
    const cipher_n_tag = data.subarray(iv_len);
    const cipher = cipher_n_tag.subarray(0, -tag_len);
    const tag = cipher_n_tag.subarray(-tag_len);

    const secret_buffer = Buffer.from(ConfigMgr.secret(), "utf8");
    const decipher = crypto.createDecipheriv("aes-256-gcm", secret_buffer, iv, {
        authTagLength: tag_len,
    });

    decipher.setAuthTag(tag);

    try {
        const dec_bytes = Buffer.concat([
            decipher.update(cipher),
            decipher.final(),
        ]);

        return dec_bytes.toString("utf8");
    }
    catch {
        return false;
    }
}

/** Returns true if `name` does not contain special symbols. */
export function validatePresetName(name) {
    if (typeof name !== "string" || name == "") return false;

    let chars = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/;
    return !chars.test(name);
}

function isIPv6(ip) {
    if (typeof ip !== "string") return;

    try {
        const url = new URL(`http://[${ip}]/`);
        return url.hostname.startsWith("[") && url.hostname.endsWith("]");
    } catch {
        return false;
    }
}

function isIPv4(ip) {
    if (typeof ip !== "string") return;
    
    const seg = ip.trim().split(".");
    if (seg.length !== 4) return;

    return seg.every(part =>
        /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255
    );
}

/** Returns true whenever `ip` is valid. */
export function validateIP(ip) {
    if (isIPv4(ip)) {
        return 4;
    }

    if (isIPv6(ip)) {
        return 6;
    }

    return false;
}

/** Generates random hex string. */
export function rndHex(number) {
    return crypto.randomBytes(number).toString('hex');
}

export default {}