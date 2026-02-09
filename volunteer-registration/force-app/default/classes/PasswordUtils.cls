public class PasswordUtils {
    
    // Hash password using SHA-256
    // Note: Apex does not support bcrypt natively. We use SHA-256 for password hashing.
    // When seeding data from Node.js, use SHA-256 instead of bcrypt to maintain compatibility.
    public static String hashPassword(String password) {
        Blob passwordBlob = Blob.valueOf(password);
        Blob hash = Crypto.generateDigest('SHA-256', passwordBlob);
        return EncodingUtil.convertToHex(hash);
    }
    
    // Verify password against hash
    public static Boolean verifyPassword(String password, String hashedPassword) {
        String newHash = hashPassword(password);
        return newHash.equals(hashedPassword);
    }
    
    // Generate random salt (optional, for enhanced security)
    public static String generateSalt() {
        Blob salt = Crypto.generateAesKey(128);
        return EncodingUtil.convertToHex(salt);
    }
    
    // Hash password with salt
    public static String hashPasswordWithSalt(String password, String salt) {
        Blob passwordBlob = Blob.valueOf(password + salt);
        Blob hash = Crypto.generateDigest('SHA-256', passwordBlob);
        return EncodingUtil.convertToHex(hash);
    }
}
