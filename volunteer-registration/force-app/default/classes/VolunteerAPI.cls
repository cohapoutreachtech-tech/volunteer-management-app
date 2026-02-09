@RestResource(urlMapping='/api/volunteers/*')
global with sharing class VolunteerAPI {
    
    private static final List<String> REQUIRED_FIELDS = new List<String>{
        'First_Name__c',
        'Last_Name__c',
        'Email__c',
        'Date_of_Birth__c',
        'Volunteer_Type__c',
        'T_Shirt_Size__c',
        'Why_Volunteer__c',
        'Community_Service_Hours__c',
        'Offender_Policy_Confirmed__c',
        'Electronic_Signature__c',
        'Signature_Date__c',
        'Registration_Date__c',
        'Status__c'
    };
    
    private static final Set<String> PROTECTED_FIELDS = new Set<String>{
        'Pass_Hash__c',
        'Registration_Date__c',
        'Offender_Policy_Confirmed__c',
        'Id',
        'CreatedDate',
        'LastModifiedDate',
        'OwnerId',
        'SystemModstamp'
    };
    
    @HttpGet
    global static void getVolunteers() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String volunteerId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        
        try {
            if (volunteerId == 'volunteers') {
                // Get all volunteers
                List<Volunteer__c> volunteers = [
                    SELECT Id, Name, First_Name__c, Last_Name__c, Email__c, Phone__c, 
                           Date_of_Birth__c, Status__c, Volunteer_Type__c, T_Shirt_Size__c,
                           Why_Volunteer__c, Community_Service_Hours__c, Electronic_Signature__c,
                           Registration_Date__c, Signature_Date__c
                    FROM Volunteer__c 
                    ORDER BY CreatedDate DESC
                ];
                
                logActivity('Volunteer', 'get', UserInfo.getUserId(), 'All volunteers retrieved');
                
                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(volunteers));
            } else {
                // Get single volunteer by ID
                // Validate ID format
                if (ValidationUtils.isEmptyOrPlaceholder(volunteerId)) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'volunteer id should not be empty'
                    }));
                    return;
                }
                
                if (!ValidationUtils.isValidSalesforceId(volunteerId)) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Invalid volunteer id format'
                    }));
                    return;
                }
                
                List<Volunteer__c> volunteers = [
                    SELECT Id, Name, First_Name__c, Last_Name__c, Email__c, Phone__c, 
                           Date_of_Birth__c, Status__c, Volunteer_Type__c, T_Shirt_Size__c,
                           Why_Volunteer__c, Community_Service_Hours__c, Electronic_Signature__c,
                           Registration_Date__c, Signature_Date__c
                    FROM Volunteer__c 
                    WHERE Id = :volunteerId 
                    LIMIT 1
                ];
                
                if (volunteers.isEmpty()) {
                    logActivity('Volunteer', 'get', UserInfo.getUserId(), 'Volunteer not found');
                    res.statusCode = 404;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Volunteer with id ' + volunteerId + ' not found'
                    }));
                    return;
                }
                
                Volunteer__c volunteer = volunteers[0];
                logActivity('Volunteer', 'get', volunteer.Id, 'Volunteer ' + volunteer.Id + ' retrieved');
                
                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(volunteer));
            }
        } catch (Exception e) {
            logActivity('Volunteer', 'get', UserInfo.getUserId(), e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error.'
            }));
        }
    }
    
    @HttpPost
    global static void createVolunteer() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        try {
            String requestBody = req.requestBody.toString();
            Map<String, Object> volunteerData = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            
            // Validate request body
            if (volunteerData == null || volunteerData.isEmpty()) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Bad request: Request body must be a valid JSON object.'
                }));
                return;
            }
            
            // Validate required fields
            Map<String, String> fieldErrors = new Map<String, String>();
            for (String field : REQUIRED_FIELDS) {
                if (!volunteerData.containsKey(field) || 
                    volunteerData.get(field) == null || 
                    String.valueOf(volunteerData.get(field)).trim() == '') {
                    fieldErrors.put(field, 'This field is required');
                }
            }
            
            if (!fieldErrors.isEmpty()) {
                List<String> missingFields = new List<String>(fieldErrors.keySet());
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Missing required field(s): ' + String.join(missingFields, ', ')
                }));
                return;
            }
            
            // Validate email format
            String email = (String) volunteerData.get('Email__c');
            if (!ValidationUtils.isValidEmail(email)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid email format'
                }));
                return;
            }
            
            // Check for duplicate email
            if (ValidationUtils.isDuplicateEmail(email, '')) {
                res.statusCode = 409;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'An account with that email already exists, reset your password if you cannot login'
                }));
                return;
            }
            
            // Validate phone if provided
            if (volunteerData.containsKey('Phone__c') && volunteerData.get('Phone__c') != null) {
                String phone = (String) volunteerData.get('Phone__c');
                if (!ValidationUtils.isValidPhone(phone)) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Invalid phone number format. Expected format: XXX-XXX-XXXX'
                    }));
                    return;
                }
            }
            
            // Validate date formats
            if (volunteerData.containsKey('Date_of_Birth__c')) {
                String dobString = String.valueOf(volunteerData.get('Date_of_Birth__c'));
                if (!ValidationUtils.isValidDateFormat(dobString)) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Invalid Date_of_Birth__c format. Expected YYYY-MM-DD'
                    }));
                    return;
                }
            }
            
            if (volunteerData.containsKey('Registration_Date__c')) {
                String regDateString = String.valueOf(volunteerData.get('Registration_Date__c'));
                if (!ValidationUtils.isValidDateFormat(regDateString)) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Invalid Registration_Date__c format. Expected YYYY-MM-DD'
                    }));
                    return;
                }
            }
            
            if (volunteerData.containsKey('Signature_Date__c')) {
                String sigDateString = String.valueOf(volunteerData.get('Signature_Date__c'));
                if (!ValidationUtils.isValidDateFormat(sigDateString)) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Invalid Signature_Date__c format. Expected YYYY-MM-DD'
                    }));
                    return;
                }
            }
            
            // Create volunteer record
            Volunteer__c volunteer = new Volunteer__c();
            volunteer.First_Name__c = (String) volunteerData.get('First_Name__c');
            volunteer.Last_Name__c = (String) volunteerData.get('Last_Name__c');
            volunteer.Email__c = email;
            volunteer.Status__c = volunteerData.containsKey('Status__c') ? 
                (String) volunteerData.get('Status__c') : 'Active';
            volunteer.Volunteer_Type__c = volunteerData.containsKey('Volunteer_Type__c') ? 
                (String) volunteerData.get('Volunteer_Type__c') : 'Individual';
            volunteer.T_Shirt_Size__c = (String) volunteerData.get('T_Shirt_Size__c');
            volunteer.Why_Volunteer__c = (String) volunteerData.get('Why_Volunteer__c');
            volunteer.Electronic_Signature__c = (String) volunteerData.get('Electronic_Signature__c');
            volunteer.Offender_Policy_Confirmed__c = (Boolean) volunteerData.get('Offender_Policy_Confirmed__c');
            
            // Handle optional fields
            if (volunteerData.containsKey('Phone__c')) {
                volunteer.Phone__c = (String) volunteerData.get('Phone__c');
            }
            
            if (volunteerData.containsKey('Community_Service_Hours__c')) {
                volunteer.Community_Service_Hours__c = (String) volunteerData.get('Community_Service_Hours__c');
            }
            
            // Handle password
            if (volunteerData.containsKey('password')) {
                String password = (String) volunteerData.get('password');
                volunteer.Pass_Hash__c = PasswordUtils.hashPassword(password);
            }
            
            // Handle dates
            if (volunteerData.containsKey('Date_of_Birth__c')) {
                String dobString = (String) volunteerData.get('Date_of_Birth__c');
                volunteer.Date_of_Birth__c = Date.valueOf(dobString);
            }
            
            if (volunteerData.containsKey('Registration_Date__c')) {
                String regDateString = (String) volunteerData.get('Registration_Date__c');
                volunteer.Registration_Date__c = Date.valueOf(regDateString);
            }
            
            if (volunteerData.containsKey('Signature_Date__c')) {
                String sigDateString = (String) volunteerData.get('Signature_Date__c');
                volunteer.Signature_Date__c = Date.valueOf(sigDateString);
            }
            
            insert volunteer;
            
            logActivity('Volunteer', 'create', volunteer.Id, 
                'User ' + volunteer.First_Name__c + ' ' + volunteer.Last_Name__c + ' was created');
            
            res.statusCode = 201;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                'message' => 'User ' + volunteer.First_Name__c + ' ' + volunteer.Last_Name__c + ' was created',
                'id' => volunteer.Id
            }));
        } catch (Exception e) {
            logActivity('Volunteer', 'create', UserInfo.getUserId(), e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error.'
            }));
        }
    }
    
    @HttpPut
    global static void updateVolunteer() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String volunteerId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        
        try {
            // Validate ID format
            if (ValidationUtils.isEmptyOrPlaceholder(volunteerId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'volunteer id should not be empty'
                }));
                return;
            }
            
            if (!ValidationUtils.isValidSalesforceId(volunteerId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid volunteer id format'
                }));
                return;
            }
            
            String requestBody = req.requestBody.toString();
            Map<String, Object> updates = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            
            // Validate request body
            if (updates == null || updates.isEmpty()) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Bad request: Request body must be a valid JSON object.'
                }));
                return;
            }
            
            // Check for protected fields
            List<String> attemptedProtected = new List<String>();
            for (String field : updates.keySet()) {
                if (PROTECTED_FIELDS.contains(field)) {
                    attemptedProtected.add(field);
                }
            }
            
            if (!attemptedProtected.isEmpty()) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'The following field(s) are protected and cannot be updated: ' + 
                        String.join(attemptedProtected, ', ')
                }));
                return;
            }
            
            // Validate email format if being updated
            if (updates.containsKey('Email__c')) {
                String email = (String) updates.get('Email__c');
                if (!ValidationUtils.isValidEmail(email)) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Invalid email format'
                    }));
                    return;
                }
                
                // Check for duplicate email
                List<Volunteer__c> existingVolunteers = [
                    SELECT Id FROM Volunteer__c 
                    WHERE Email__c = :email AND Id != :volunteerId 
                    LIMIT 1
                ];
                
                if (!existingVolunteers.isEmpty()) {
                    res.statusCode = 409;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'An account with that email already exists, reset your password if you cannot login'
                    }));
                    return;
                }
            }
            
            // Validate phone if being updated
            if (updates.containsKey('Phone__c') && updates.get('Phone__c') != null) {
                String phone = (String) updates.get('Phone__c');
                if (!ValidationUtils.isValidPhone(phone)) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Invalid phone number format'
                    }));
                    return;
                }
            }
            
            // Fetch existing volunteer
            List<Volunteer__c> volunteers = [
                SELECT Id FROM Volunteer__c WHERE Id = :volunteerId LIMIT 1
            ];
            
            if (volunteers.isEmpty()) {
                logActivity('Volunteer', 'update', UserInfo.getUserId(), 'Volunteer not found');
                res.statusCode = 404;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Volunteer not found'
                }));
                return;
            }
            
            Volunteer__c volunteer = volunteers[0];
            
            // Update fields
            if (updates.containsKey('First_Name__c')) volunteer.First_Name__c = (String) updates.get('First_Name__c');
            if (updates.containsKey('Last_Name__c')) volunteer.Last_Name__c = (String) updates.get('Last_Name__c');
            if (updates.containsKey('Email__c')) volunteer.Email__c = (String) updates.get('Email__c');
            if (updates.containsKey('Phone__c')) volunteer.Phone__c = (String) updates.get('Phone__c');
            if (updates.containsKey('Status__c')) volunteer.Status__c = (String) updates.get('Status__c');
            if (updates.containsKey('Volunteer_Type__c')) volunteer.Volunteer_Type__c = (String) updates.get('Volunteer_Type__c');
            if (updates.containsKey('T_Shirt_Size__c')) volunteer.T_Shirt_Size__c = (String) updates.get('T_Shirt_Size__c');
            if (updates.containsKey('Why_Volunteer__c')) volunteer.Why_Volunteer__c = (String) updates.get('Why_Volunteer__c');
            if (updates.containsKey('Electronic_Signature__c')) volunteer.Electronic_Signature__c = (String) updates.get('Electronic_Signature__c');
            
            if (updates.containsKey('Date_of_Birth__c')) {
                String dobString = (String) updates.get('Date_of_Birth__c');
                volunteer.Date_of_Birth__c = Date.valueOf(dobString);
            }
            
            if (updates.containsKey('Signature_Date__c')) {
                String sigDateString = (String) updates.get('Signature_Date__c');
                volunteer.Signature_Date__c = Date.valueOf(sigDateString);
            }
            
            if (updates.containsKey('Community_Service_Hours__c')) {
                volunteer.Community_Service_Hours__c = (String) updates.get('Community_Service_Hours__c');
            }
            
            // Handle password update
            if (updates.containsKey('password')) {
                String password = (String) updates.get('password');
                volunteer.Pass_Hash__c = PasswordUtils.hashPassword(password);
            }
            
            update volunteer;
            
            logActivity('Volunteer', 'update', volunteer.Id, 
                'Account for user ' + volunteer.Id + ' was updated.');
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Account for user ' + volunteer.Id + ' was updated.'
            }));
        } catch (Exception e) {
            logActivity('Volunteer', 'update', UserInfo.getUserId(), e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error.'
            }));
        }
    }
    
    @HttpDelete
    global static void deleteVolunteer() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String volunteerId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        
        try {
            // Validate ID format
            if (ValidationUtils.isEmptyOrPlaceholder(volunteerId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'volunteer id should not be empty'
                }));
                return;
            }
            
            if (!ValidationUtils.isValidSalesforceId(volunteerId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid volunteer id format'
                }));
                return;
            }
            
            List<Volunteer__c> volunteers = [
                SELECT Id FROM Volunteer__c WHERE Id = :volunteerId LIMIT 1
            ];
            
            if (volunteers.isEmpty()) {
                logActivity('Volunteer', 'delete', UserInfo.getUserId(), 'Volunteer not found');
                res.statusCode = 404;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Volunteer not found'
                }));
                return;
            }
            
            Volunteer__c volunteer = volunteers[0];
            delete volunteer;
            
            logActivity('Volunteer', 'delete', volunteerId, 
                'Account for user ' + volunteerId + ' was deleted.');
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Account for user ' + volunteerId + ' was deleted.'
            }));
        } catch (Exception e) {
            logActivity('Volunteer', 'delete', UserInfo.getUserId(), e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error.'
            }));
        }
    }
    
    // Helper method to log activities
    private static void logActivity(String schema, String activityType, String userId, String response) {
        try {
            History__c history = new History__c();
            history.Schema__c = schema;
            history.Activity_Type__c = activityType;
            history.User__c = userId;
            history.Activity_Response__c = response;
            history.Activity_Timestamp__c = System.now();
            insert history;
        } catch (Exception e) {
            System.debug('Failed to log activity: ' + e.getMessage());
        }
    }
}
