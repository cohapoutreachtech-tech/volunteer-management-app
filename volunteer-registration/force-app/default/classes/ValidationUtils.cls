public class ValidationUtils {
    
    // Validate Salesforce ID (15 or 18 characters)
    public static Boolean isValidSalesforceId(String id) {
        if (String.isBlank(id)) {
            return false;
        }
        
        String trimmedId = id.trim();
        Pattern idPattern = Pattern.compile('[a-zA-Z0-9]{15}|[a-zA-Z0-9]{18}');
        return idPattern.matcher(trimmedId).matches();
    }
    
    // Validate email format
    public static Boolean isValidEmail(String email) {
        if (String.isBlank(email)) {
            return false;
        }
        
        Pattern emailPattern = Pattern.compile('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
        return emailPattern.matcher(email).matches();
    }
    
    // Validate phone number (basic US format)
    public static Boolean isValidPhone(String phone) {
        if (String.isBlank(phone)) {
            return true; // Phone is optional
        }
        
        // Remove common formatting characters
        String cleanPhone = phone.replaceAll('[^0-9]', '');
        return cleanPhone.length() >= 10 && cleanPhone.length() <= 15;
    }
    
    // Check if ID is empty or placeholder
    public static Boolean isEmptyOrPlaceholder(String id) {
        if (String.isBlank(id)) {
            return true;
        }
        
        String normalized = id.trim().toLowerCase();
        return normalized == '' || 
               normalized == ':id' || 
               normalized == 'undefined' || 
               normalized == 'null';
    }
    
    // Validate required fields
    public static Map<String, String> validateRequiredFields(Map<String, Object> data, List<String> requiredFields) {
        Map<String, String> errors = new Map<String, String>();
        
        for (String field : requiredFields) {
            if (!data.containsKey(field) || 
                data.get(field) == null || 
                (data.get(field) instanceof String && String.isBlank((String)data.get(field)))) {
                errors.put(field, field + ' is required');
            }
        }
        
        return errors;
    }
    
    // Create error response
    public static String createErrorResponse(String message) {
        Map<String, String> error = new Map<String, String>{'message' => message};
        return JSON.serialize(error);
    }
    
    // Create success response
    public static String createSuccessResponse(Object data) {
        return JSON.serialize(data);
    }
}
