

export class CryptoMgr {
    static toUint8Array = str => (new TextEncoder()).encode(str);

    static #toBase64(bytes) {
        let result = "";
        bytes.map(b => result += String.fromCharCode(b));
        return btoa(result);
    }

    static #fromBase64 = base64 => Uint8Array.from(atob(base64), char => char.charCodeAt(0));

    /** encrypts data using aes-256-gcm.
     * `data` - string data to encrypt;
     * `secret` - 32-bytes key as a string.
     */
    static async encrypt(data, secret_str) {
        if (!secret_str || secret_str == "") return;
        
        const secret_bytes = CryptoMgr.toUint8Array(secret_str);
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const secret = await crypto.subtle.importKey(
            "raw", secret_bytes, { name: "AES-GCM" }, false, ["encrypt"]
        );

        const cipher_n_tag = new Uint8Array(await crypto.subtle.encrypt(
            { name: "AES-GCM", iv, tagLength: 128 }, secret, this.toUint8Array(data)
        ));

        const result = new Uint8Array(iv.length + cipher_n_tag.length);
        result.set(iv, 0);
        result.set(cipher_n_tag, iv.length);

        return this.#toBase64(result);
    }

    /** decrypts data using aes-256-gcm. */
    static async decrypt(enc_base64, secret_str) {
        if (!secret_str || secret_str == "") return;
        
        if (!enc_base64) {
            return false;
        }

        const secret_bytes = CryptoMgr.toUint8Array(secret_str);
        const data = this.#fromBase64(enc_base64);
        const iv_len = 12;
        const tag_size = 16; // 16 * 8 = 128bit gcm tag

        if (data.length < iv_len + tag_size) {
            return false;
        }

        const iv = data.slice(0, iv_len); // iv slice
        const cipher_n_tag = data.slice(iv_len); // cipher + tag slice

        const secret = await crypto.subtle.importKey(
            "raw", secret_bytes, { name: "AES-GCM" }, false, ["decrypt"]
        );

        const result = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv, tagLength: 128 }, secret, cipher_n_tag
        );

        return (new TextDecoder()).decode(result);
    }
}