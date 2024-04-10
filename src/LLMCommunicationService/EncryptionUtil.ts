import crypto from 'crypto';

class EncryptionUtil {
  
    // Class TBD if it will be used or not
    // A private variable to hold the encryption key.
    private encryptionKey: string;

    // The constructor of the class. It takes an encryption key as a parameter.
    constructor(encryptionKey: string) {
        // hash key
        this.encryptionKey = crypto.createHash('sha256').update(String(encryptionKey)).digest('base64').substr(0, 32);
    }

    /**
     * A method to encrypt a given text.
     * @param text The text to encrypt.
     * @returns The encrypted text as a string.
     */
    encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
        // Encrypt the text and return it as a base64 string.
        return Buffer.concat([iv, encrypted]).toString('base64');
    }

    /**
     * A method to decrypt a given piece of text.
     * @param encryptedText The text to decrypt.
     * @returns The decrypted text.
     */
    decrypt(encryptedText: string): string {
        const data = Buffer.from(encryptedText, 'base64');
        const iv = data.slice(0,16);
        const encrypted = data.slice(16);
        // Create a decipher using the AES-256-CBC algorithm, the encryption key, and the extracted IV.
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
        // Decrypt the text and return it as a utf8 string.
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    }
} 
