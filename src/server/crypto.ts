import {createCipheriv, createDecipheriv, randomBytes} from 'crypto';
import config from '../config';

/**
 * Шифрует текст.
 * @param text
 */
export function encrypt(text: string) {
  let iv = randomBytes(16);
  let cipher = createCipheriv('aes-256-cbc', Buffer.from(config.encryptionSecret), iv);
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Расшифровывает текст.
 * @param text
 */
export function decrypt(text: string) {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift() || '', 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = createDecipheriv('aes-256-cbc', Buffer.from(config.encryptionSecret), iv);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}
