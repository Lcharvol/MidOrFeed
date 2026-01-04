import crypto from "crypto";

/**
 * Utilitaires pour le chiffrement des données sensibles au repos
 * 
 * Note: Pour une sécurité maximale, utilisez un service de gestion de clés (KMS)
 * comme AWS KMS, Google Cloud KMS, ou HashiCorp Vault
 */

/**
 * Clé de chiffrement (doit être stockée dans une variable d'environnement sécurisée)
 * En production, utiliser un service KMS pour gérer les clés
 */
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  // La clé doit faire 32 bytes (256 bits) pour AES-256
  // Si la clé est fournie en hex, la convertir
  if (key.length === 64) {
    return Buffer.from(key, "hex");
  }

  // Sinon, dériver une clé avec PBKDF2
  // Use ENCRYPTION_SALT env var or derive salt from key hash for consistency
  const salt = process.env.ENCRYPTION_SALT ||
    crypto.createHash("sha256").update(key + "midorfeed-salt").digest("hex").slice(0, 32);
  return crypto.pbkdf2Sync(key, salt, 100000, 32, "sha256");
};

/**
 * Algorithme de chiffrement
 */
const ALGORITHM = "aes-256-gcm";

/**
 * Chiffre une valeur avec AES-256-GCM
 */
export const encrypt = (text: string): string => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // Initialization Vector
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Retourner IV + authTag + données chiffrées (tout en hex)
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    throw new Error(`Erreur lors du chiffrement: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
  }
};

/**
 * Déchiffre une valeur chiffrée avec AES-256-GCM
 */
export const decrypt = (encryptedData: string): string => {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(":");
    
    if (parts.length !== 3) {
      throw new Error("Format de données chiffrées invalide");
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(`Erreur lors du déchiffrement: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
  }
};

/**
 * Hash une valeur de manière irréversible (pour les données qui ne doivent jamais être déchiffrées)
 * Utilise SHA-256 avec un salt
 */
export const hashSensitive = (value: string, salt?: string): string => {
  const usedSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(value + usedSalt).digest("hex");
  return `${usedSalt}:${hash}`;
};

/**
 * Vérifie si une valeur correspond à un hash
 */
export const verifyHash = (value: string, hashedValue: string): boolean => {
  const [salt, hash] = hashedValue.split(":");
  if (!salt || !hash) {
    return false;
  }
  const computedHash = crypto.createHash("sha256").update(value + salt).digest("hex");
  return computedHash === hash;
};

