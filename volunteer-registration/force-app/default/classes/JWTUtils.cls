public class JWTUtils {
    
    private static final String JWT_SECRET = 'cohap-volunteer-management-secret-key-2026';
    private static final String ALGORITHM = 'HS256';
    
    // Generate JWT token
    public static String generateToken(String userId, String email) {
        // Create header
        Map<String, Object> header = new Map<String, Object>{
            'alg' => ALGORITHM,
            'typ' => 'JWT'
        };
        
        // Create payload with 24 hour expiration
        Long issuedAt = System.currentTimeMillis() / 1000;
        Long expiresAt = issuedAt + (24 * 60 * 60); // 24 hours
        
        Map<String, Object> payload = new Map<String, Object>{
            'id' => userId,
            'email' => email,
            'iat' => issuedAt,
            'exp' => expiresAt
        };
        
        // Encode header and payload
        String encodedHeader = base64UrlEncode(JSON.serialize(header));
        String encodedPayload = base64UrlEncode(JSON.serialize(payload));
        
        // Create signature
        String dataToSign = encodedHeader + '.' + encodedPayload;
        String signature = signData(dataToSign);
        
        // Return complete JWT
        return dataToSign + '.' + signature;
    }
    
    // Validate JWT token
    public static Map<String, Object> validateToken(String token) {
        try {
            if (String.isBlank(token)) {
                return null;
            }
            
            // Remove 'Bearer ' if present
            if (token.startsWith('Bearer ')) {
                token = token.substring(7);
            }
            
            // Split token
            List<String> parts = token.split('\\.');
            if (parts.size() != 3) {
                return null;
            }
            
            String encodedHeader = parts[0];
            String encodedPayload = parts[1];
            String signature = parts[2];
            
            // Verify signature
            String dataToSign = encodedHeader + '.' + encodedPayload;
            String expectedSignature = signData(dataToSign);
            
            if (signature != expectedSignature) {
                return null;
            }
            
            // Decode payload
            String payloadJson = base64UrlDecode(encodedPayload);
            Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(payloadJson);
            
            // Check expiration
            Long exp = (Long) payload.get('exp');
            Long now = System.currentTimeMillis() / 1000;
            
            if (exp < now) {
                return null; // Token expired
            }
            
            return payload;
            
        } catch (Exception e) {
            System.debug('JWT validation error: ' + e.getMessage());
            return null;
        }
    }
    
    // Sign data using HMAC SHA256
    private static String signData(String data) {
        Blob hmac = Crypto.generateMac('HmacSHA256', Blob.valueOf(data), Blob.valueOf(JWT_SECRET));
        return base64UrlEncode(EncodingUtil.base64Encode(hmac));
    }
    
    // Base64 URL encode
    private static String base64UrlEncode(String input) {
        String base64 = EncodingUtil.base64Encode(Blob.valueOf(input));
        return base64.replace('+', '-').replace('/', '_').replace('=', '');
    }
    
    // Base64 URL decode
    private static String base64UrlDecode(String input) {
        String base64 = input.replace('-', '+').replace('_', '/');
        
        // Add padding if needed
        Integer padding = Math.mod(4 - Math.mod(base64.length(), 4), 4);
        for (Integer i = 0; i < padding; i++) {
            base64 += '=';
        }
        
        return EncodingUtil.base64Decode(base64).toString();
    }
}
