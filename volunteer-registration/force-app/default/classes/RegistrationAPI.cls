@RestResource(urlMapping='/api/registrations/*')
global with sharing class RegistrationAPI {
    
    private static final List<String> REQUIRED_FIELDS = new List<String>{
        'Volunteer__c',
        'Event__c',
        'Registration_Status__c'
    };
    
    @HttpGet
    global static void getRegistrations() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String requestURI = req.requestURI;
        List<String> uriParts = requestURI.split('/');
        
        try {
            // Check if requesting by volunteer or event
            if (requestURI.contains('/volunteer/')) {
                // GET /api/registrations/volunteer/:volunteerId
                String volunteerId = uriParts[uriParts.size() - 1];
                getRegistrationsByVolunteer(volunteerId, res);
            } else if (requestURI.contains('/event/')) {
                // GET /api/registrations/event/:eventId
                String eventId = uriParts[uriParts.size() - 1];
                getRegistrationsByEvent(eventId, res);
            } else if (uriParts[uriParts.size() - 1] != 'registrations') {
                // GET /api/registrations/:id
                String registrationId = uriParts[uriParts.size() - 1];
                getRegistrationById(registrationId, res);
            } else {
                // GET /api/registrations - Get all
                List<Registration__c> registrations = [
                    SELECT Id, Name, Volunteer__c, Event__c, Registration_Status__c,
                           Registration_Date__c, Attended__c
                    FROM Registration__c
                    ORDER BY CreatedDate DESC
                ];
                
                logActivity('Registration', 'get', UserInfo.getUserId(), 'All registrations retrieved');
                
                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(registrations));
            }
        } catch (Exception e) {
            logActivity('Registration', 'get', UserInfo.getUserId(), e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error.'
            }));
        }
    }
    
    private static void getRegistrationById(String registrationId, RestResponse res) {
        // Validate ID
        if (ValidationUtils.isEmptyOrPlaceholder(registrationId)) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'registration id should not be empty'
            }));
            return;
        }
        
        if (!ValidationUtils.isValidSalesforceId(registrationId)) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Invalid registration id format'
            }));
            return;
        }
        
        List<Registration__c> registrations = [
            SELECT Id, Name, Volunteer__c, Event__c, Registration_Status__c,
                   Registration_Date__c, Attended__c
            FROM Registration__c
            WHERE Id = :registrationId
            LIMIT 1
        ];
        
        if (registrations.isEmpty()) {
            logActivity('Registration', 'get', UserInfo.getUserId(), 'Registration ' + registrationId + ' not found');
            res.statusCode = 404;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Registration not found'
            }));
            return;
        }
        
        logActivity('Registration', 'get', UserInfo.getUserId(), 'Registration ' + registrationId + ' retrieved');
        
        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(registrations[0]));
    }
    
    private static void getRegistrationsByVolunteer(String volunteerId, RestResponse res) {
        // Validate volunteer ID
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
        
        List<Registration__c> registrations = [
            SELECT Id, Name, Volunteer__c, Event__c, Registration_Status__c,
                   Registration_Date__c, Attended__c
            FROM Registration__c
            WHERE Volunteer__c = :volunteerId
            ORDER BY CreatedDate DESC
        ];
        
        logActivity('Registration', 'get', UserInfo.getUserId(), 
            'Registrations for volunteer ' + volunteerId + ' retrieved');
        
        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(registrations));
    }
    
    private static void getRegistrationsByEvent(String eventId, RestResponse res) {
        // Validate event ID
        if (ValidationUtils.isEmptyOrPlaceholder(eventId)) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'event id should not be empty'
            }));
            return;
        }
        
        if (!ValidationUtils.isValidSalesforceId(eventId)) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Invalid event id format'
            }));
            return;
        }
        
        List<Registration__c> registrations = [
            SELECT Id, Name, Volunteer__c, Event__c, Registration_Status__c,
                   Registration_Date__c, Attended__c
            FROM Registration__c
            WHERE Event__c = :eventId
            ORDER BY CreatedDate DESC
        ];
        
        logActivity('Registration', 'get', UserInfo.getUserId(), 
            'Registrations for event ' + eventId + ' retrieved');
        
        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(registrations));
    }
    
    @HttpPost
    global static void createRegistration() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        try {
            String requestBody = req.requestBody.toString();
            Map<String, Object> registrationData = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            
            // Validate request body
            if (registrationData == null || registrationData.isEmpty()) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Bad request: Request body must be a valid JSON object.'
                }));
                return;
            }
            
            // Validate required fields
            List<String> missingFields = new List<String>();
            List<String> emptyIds = new List<String>();
            
            for (String field : REQUIRED_FIELDS) {
                if (!registrationData.containsKey(field) || 
                    registrationData.get(field) == null || 
                    String.valueOf(registrationData.get(field)).trim() == '') {
                    
                    if (field == 'Volunteer__c') {
                        emptyIds.add('Volunteer id');
                    } else if (field == 'Event__c') {
                        emptyIds.add('Event id');
                    } else {
                        missingFields.add(field);
                    }
                }
            }
            
            // Build error message matching Node.js format
            if (!emptyIds.isEmpty() || !missingFields.isEmpty()) {
                List<String> messageParts = new List<String>();
                
                if (emptyIds.size() == 1) {
                    messageParts.add(emptyIds[0] + ' is empty');
                } else if (emptyIds.size() == 2) {
                    messageParts.add(emptyIds[0] + ' and ' + emptyIds[1] + ' are empty');
                }
                
                if (missingFields.size() == 1) {
                    messageParts.add(missingFields[0] + ' is required');
                } else if (missingFields.size() > 1) {
                    String lastField = missingFields.remove(missingFields.size() - 1);
                    messageParts.add(String.join(missingFields, ', ') + ', and ' + lastField + ' are required');
                }
                
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => String.join(messageParts, '; ')
                }));
                return;
            }
            
            // Validate Volunteer ID
            String volunteerId = (String) registrationData.get('Volunteer__c');
            if (!ValidationUtils.isValidSalesforceId(volunteerId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid volunteer id format'
                }));
                return;
            }
            
            // Validate Event ID
            String eventId = (String) registrationData.get('Event__c');
            if (!ValidationUtils.isValidSalesforceId(eventId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid event id format'
                }));
                return;
            }
            
            // Check if volunteer exists
            List<Volunteer__c> volunteers = [SELECT Id FROM Volunteer__c WHERE Id = :volunteerId LIMIT 1];
            if (volunteers.isEmpty()) {
                res.statusCode = 404;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Volunteer not found'
                }));
                return;
            }
            
            // Check if event exists
            List<Event__c> events = [SELECT Id FROM Event__c WHERE Id = :eventId LIMIT 1];
            if (events.isEmpty()) {
                res.statusCode = 404;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Event not found'
                }));
                return;
            }
            
            // Create registration
            Registration__c registration = new Registration__c();
            registration.Volunteer__c = volunteerId;
            registration.Event__c = eventId;
            registration.Registration_Status__c = (String) registrationData.get('Registration_Status__c');
            
            // Handle optional fields
            if (registrationData.containsKey('Registration_Date__c')) {
                String regDateString = (String) registrationData.get('Registration_Date__c');
                registration.Registration_Date__c = Date.valueOf(regDateString);
            }
            
            if (registrationData.containsKey('Attended__c')) {
                registration.Attended__c = (Boolean) registrationData.get('Attended__c');
            }
            
            insert registration;
            
            logActivity('Registration', 'create', UserInfo.getUserId(), 
                'Registration ' + registration.Name + ' created');
            
            res.statusCode = 201;
            res.responseBody = Blob.valueOf(JSON.serialize(registration));
        } catch (Exception e) {
            logActivity('Registration', 'create', UserInfo.getUserId(), e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error.'
            }));
        }
    }
    
    @HttpPut
    global static void updateRegistration() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String registrationId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        
        try {
            // Validate ID
            if (ValidationUtils.isEmptyOrPlaceholder(registrationId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'registration id should not be empty'
                }));
                return;
            }
            
            if (!ValidationUtils.isValidSalesforceId(registrationId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid registration id format'
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
            
            // Fetch existing registration
            List<Registration__c> registrations = [
                SELECT Id FROM Registration__c WHERE Id = :registrationId LIMIT 1
            ];
            
            if (registrations.isEmpty()) {
                logActivity('Registration', 'update', UserInfo.getUserId(), 
                    'Registration ' + registrationId + ' not found');
                res.statusCode = 404;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Registration not found'
                }));
                return;
            }
            
            Registration__c registration = registrations[0];
            
            // Update fields
            if (updates.containsKey('Volunteer__c')) {
                String volunteerId = (String) updates.get('Volunteer__c');
                if (!ValidationUtils.isValidSalesforceId(volunteerId)) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Invalid volunteer id format'
                    }));
                    return;
                }
                registration.Volunteer__c = volunteerId;
            }
            
            if (updates.containsKey('Event__c')) {
                String eventId = (String) updates.get('Event__c');
                if (!ValidationUtils.isValidSalesforceId(eventId)) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Invalid event id format'
                    }));
                    return;
                }
                registration.Event__c = eventId;
            }
            
            if (updates.containsKey('Registration_Status__c')) {
                registration.Registration_Status__c = (String) updates.get('Registration_Status__c');
            }
            
            if (updates.containsKey('Attended__c')) {
                registration.Attended__c = (Boolean) updates.get('Attended__c');
            }
            
            if (updates.containsKey('Registration_Date__c')) {
                String regDateString = (String) updates.get('Registration_Date__c');
                registration.Registration_Date__c = Date.valueOf(regDateString);
            }
            
            update registration;
            
            logActivity('Registration', 'update', UserInfo.getUserId(), 
                'Registration ' + registrationId + ' updated');
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Registration ' + registrationId + ' updated.'
            }));
        } catch (Exception e) {
            logActivity('Registration', 'update', UserInfo.getUserId(), e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error.'
            }));
        }
    }
    
    @HttpDelete
    global static void deleteRegistration() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String registrationId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        
        try {
            // Validate ID
            if (ValidationUtils.isEmptyOrPlaceholder(registrationId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'registration id should not be empty'
                }));
                return;
            }
            
            if (!ValidationUtils.isValidSalesforceId(registrationId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid registration id format'
                }));
                return;
            }
            
            List<Registration__c> registrations = [
                SELECT Id FROM Registration__c WHERE Id = :registrationId LIMIT 1
            ];
            
            if (registrations.isEmpty()) {
                logActivity('Registration', 'delete', UserInfo.getUserId(), 
                    'Registration ' + registrationId + ' not found');
                res.statusCode = 404;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Registration not found'
                }));
                return;
            }
            
            Registration__c registration = registrations[0];
            delete registration;
            
            logActivity('Registration', 'delete', UserInfo.getUserId(), 
                'Registration ' + registrationId + ' deleted');
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Registration ' + registrationId + ' deleted.'
            }));
        } catch (Exception e) {
            logActivity('Registration', 'delete', UserInfo.getUserId(), e.getMessage());
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
