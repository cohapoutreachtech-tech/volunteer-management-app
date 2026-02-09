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
    
    // Validate date format (YYYY-MM-DD)
    public static Boolean isValidDateFormat(String dateStr) {
        if (String.isBlank(dateStr)) {
            return false;
        }
        
        try {
            Date.valueOf(dateStr);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    // Validate datetime format (ISO 8601)
    public static Boolean isValidDateTimeFormat(String dateTimeStr) {
        if (String.isBlank(dateTimeStr)) {
            return false;
        }
        
        try {
            Datetime.valueOf(dateTimeStr.replace('T', ' ').replace('Z', ''));
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    // Validate time format (HH:MM:SS)
    public static Boolean isValidTimeFormat(String timeStr) {
        if (String.isBlank(timeStr)) {
            return false;
        }
        
        try {
            Time.newInstance(
                Integer.valueOf(timeStr.substring(0, 2)),
                Integer.valueOf(timeStr.substring(3, 5)),
                Integer.valueOf(timeStr.substring(6, 8)),
                0
            );
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    // Validate numeric field
    public static Boolean isValidNumber(Object value) {
        if (value == null) {
            return false;
        }
        
        try {
            Decimal.valueOf(String.valueOf(value));
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    // Validate URL format
    public static Boolean isValidURL(String url) {
        if (String.isBlank(url)) {
            return true; // URL is optional
        }
        
        Pattern urlPattern = Pattern.compile('^(https?://)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([/\\w \\.-]*)*/?$');
        return urlPattern.matcher(url).matches();
    }
    
    // Check for duplicate email
    public static Boolean isDuplicateEmail(String email, String excludeId) {
        List<Volunteer__c> existing = [
            SELECT Id FROM Volunteer__c 
            WHERE Email__c = :email 
            AND Id != :excludeId
            LIMIT 1
        ];
        return !existing.isEmpty();
    }
    
    // Check for duplicate volunteer-event registration
    public static Boolean isDuplicateRegistration(String volunteerId, String eventId, String excludeId) {
        List<Registration__c> existing = [
            SELECT Id FROM Registration__c 
            WHERE Volunteer__c = :volunteerId 
            AND Event__c = :eventId
            AND Id != :excludeId
            LIMIT 1
        ];
        return !existing.isEmpty();
    }
    
    // Verify record exists
    public static Boolean recordExists(String objectName, String recordId) {
        if (String.isBlank(recordId) || !isValidSalesforceId(recordId)) {
            return false;
        }
        
        String query = 'SELECT Id FROM ' + objectName + ' WHERE Id = :recordId LIMIT 1';
        List<SObject> records = Database.query(query);
        return !records.isEmpty();
    }
    
    // Create error response
    public static String createErrorResponse(String message) {
        Map<String, String> error = new Map<String, String>{'message' => message};
        return JSON.serialize(error);
    }
    
    // Create validation error response
    public static String createValidationErrorResponse(Map<String, String> fieldErrors) {
        Map<String, Object> error = new Map<String, Object>{
            'message' => 'Validation failed',
            'errors' => fieldErrors
        };
        return JSON.serialize(error);
    }
    
    // Create success response
    public static String createSuccessResponse(Object data) {
        return JSON.serialize(data);
    }
}
