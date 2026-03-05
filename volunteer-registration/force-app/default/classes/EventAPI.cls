@RestResource(urlMapping='/api/events/*')
global without sharing class EventAPI {
    
    private static final List<String> REQUIRED_FIELDS = new List<String>{
        'Location__c',
        'Event_Date__c',
        'Event_Status__c'
    };


    @HttpGet
    global static void getEvents() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        System.debug('EventAPI.getEvents: Incoming request: ' + req.requestURI);
        System.debug('Headers: ' + req.headers);

        // JWT token validation
        String apiKey = req.headers.get('X-API-KEY');
        if (apiKey == null || apiKey == '') {
            System.debug('EventAPI.getEvents: Missing X-API-KEY header');
            logActivity('Event', 'get', UserInfo.getUserId(), 'Missing X-API-KEY header');
            res.statusCode = 403;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Forbidden: X-API-KEY header missing or empty. Ensure your request includes a valid JWT token.'
            }));
            return;
        }
        Map<String, Object> jwtPayload = JWTUtils.validateToken(apiKey);
        if (jwtPayload == null) {
            System.debug('EventAPI.getEvents: Invalid or expired JWT token');
            logActivity('Event', 'get', UserInfo.getUserId(), 'Invalid or expired JWT token');
            res.statusCode = 403;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Forbidden: Invalid or expired JWT token in X-API-KEY header.'
            }));
            return;
        }

        String eventId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        System.debug('EventAPI.getEvents: eventId = ' + eventId);

        try {
            if (eventId != 'events') {
                // Validate ID format
                System.debug('EventAPI.getEvents: Querying event by ID: ' + eventId);
                if (ValidationUtils.isEmptyOrPlaceholder(eventId)) {
                    System.debug('EventAPI.getEvents: event id is empty');
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'event id should not be empty'
                    }));
                    return;
                }
                if (!ValidationUtils.isValidSalesforceId(eventId)) {
                    System.debug('EventAPI.getEvents: Invalid event id format');
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Invalid event id format'
                    }));
                    return;
                }
                // Get single event
                List<Event__c> events = [
                    SELECT Id, Name, Title__c, Description__c, Location__c, Event_Date__c, 
                           Event_Time__c, Event_Status__c, Max_Volunteers__c, 
                           Registered_Volunteers__c, Checked_In_Volunteers__c,
                           Image_1_URL__c, Image_2_URL__c, Image_3_URL__c
                    FROM Event__c 
                    WHERE Id = :eventId 
                    LIMIT 1
                ];
                System.debug('EventAPI.getEvents: Query result size: ' + events.size());
                if (events.isEmpty()) {
                    res.statusCode = 404;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Event with id ' + eventId + ' not found'
                    }));
                    return;
                }
                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(events[0]));
            } else {
                // Get all events
                System.debug('EventAPI.getEvents: Querying all events');
                List<Event__c> events = [
                    SELECT Id, Name, Title__c, Description__c, Location__c, Event_Date__c, 
                           Event_Time__c, Event_Status__c, Max_Volunteers__c, 
                           Registered_Volunteers__c, Checked_In_Volunteers__c,
                           Image_1_URL__c, Image_2_URL__c, Image_3_URL__c
                    FROM Event__c 
                    ORDER BY Event_Date__c DESC
                ];
                System.debug('EventAPI.getEvents: Found ' + events.size() + ' events');
                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(events));
            }
        } catch (Exception e) {
            System.debug('EventAPI.getEvents: Exception: ' + e.getMessage() + '\n' + e.getStackTraceString());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error: ' + e.getMessage()
            }));
        }
    }

    // Helper method to log activities
    // ...existing code...
    
    @HttpPost
    global static void createEvent() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        try {
            String requestBody = req.requestBody.toString();
            Map<String, Object> eventData = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            
            // Validate request body
            if (eventData == null || eventData.isEmpty()) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Bad request: Request body must be a valid JSON object.'
                }));
                return;
            }
            
            // Validate required fields
            Map<String, String> fieldErrors = ValidationUtils.validateRequiredFields(eventData, REQUIRED_FIELDS);
            if (!fieldErrors.isEmpty()) {
                List<String> missingFields = new List<String>(fieldErrors.keySet());
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Missing required field(s): ' + String.join(missingFields, ', ')
                }));
                return;
            }
            
            // Validate Event_Date__c format
            String dateString = String.valueOf(eventData.get('Event_Date__c'));
            if (!ValidationUtils.isValidDateFormat(dateString)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid Event_Date__c format. Expected YYYY-MM-DD'
                }));
                return;
            }
            
            // Validate Max_Volunteers__c if provided
            if (eventData.containsKey('Max_Volunteers__c') && eventData.get('Max_Volunteers__c') != null) {
                if (!ValidationUtils.isValidNumber(eventData.get('Max_Volunteers__c'))) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Invalid Max_Volunteers__c: must be a number'
                    }));
                    return;
                }
            }
            
            // Validate image URLs if provided
            List<String> imageFields = new List<String>{'Image_1_URL__c', 'Image_2_URL__c', 'Image_3_URL__c'};
            for (String imageField : imageFields) {
                if (eventData.containsKey(imageField) && eventData.get(imageField) != null) {
                    String imageUrl = String.valueOf(eventData.get(imageField));
                    if (!ValidationUtils.isValidURL(imageUrl)) {
                        res.statusCode = 400;
                        res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                            'message' => 'Invalid ' + imageField + ' format. Must be a valid URL'
                        }));
                        return;
                    }
                }
            }
            
            Event__c event = new Event__c();
            event.Title__c = (String) eventData.get('Title__c');
            event.Description__c = (String) eventData.get('Description__c');
            event.Location__c = (String) eventData.get('Location__c');
            event.Event_Status__c = (String) eventData.get('Event_Status__c');
            event.Max_Volunteers__c = eventData.containsKey('Max_Volunteers__c') ? 
                Decimal.valueOf(String.valueOf(eventData.get('Max_Volunteers__c'))) : null;
            
            // Handle dates
            event.Event_Date__c = Date.valueOf(dateString);
            
            // Handle images
            if (eventData.containsKey('Image_1_URL__c')) event.Image_1_URL__c = (String) eventData.get('Image_1_URL__c');
            if (eventData.containsKey('Image_2_URL__c')) event.Image_2_URL__c = (String) eventData.get('Image_2_URL__c');
            if (eventData.containsKey('Image_3_URL__c')) event.Image_3_URL__c = (String) eventData.get('Image_3_URL__c');
            
            insert event;
            
            res.statusCode = 201;
            res.responseBody = Blob.valueOf(JSON.serialize(event));
        } catch (Exception e) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error: ' + e.getMessage()
            }));
        }
    }
    
    @HttpPut
    global static void updateEvent() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String eventId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        
        try {
            // Validate ID
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
            
            // Check if event exists
            List<Event__c> events = [SELECT Id FROM Event__c WHERE Id = :eventId LIMIT 1];
            if (events.isEmpty()) {
                res.statusCode = 404;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Event with id ' + eventId + ' not found'
                }));
                return;
            }
            
            Event__c event = events[0];
            
            // Validate date format if provided
            if (updates.containsKey('Event_Date__c') && updates.get('Event_Date__c') != null) {
                String dateString = String.valueOf(updates.get('Event_Date__c'));
                if (!ValidationUtils.isValidDateFormat(dateString)) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Invalid Event_Date__c format. Expected YYYY-MM-DD'
                    }));
                    return;
                }
            }
            
            // Validate Max_Volunteers__c if provided
            if (updates.containsKey('Max_Volunteers__c') && updates.get('Max_Volunteers__c') != null) {
                if (!ValidationUtils.isValidNumber(updates.get('Max_Volunteers__c'))) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Invalid Max_Volunteers__c: must be a number'
                    }));
                    return;
                }
            }
            
            // Update fields
            if (updates.containsKey('Title__c')) event.Title__c = (String) updates.get('Title__c');
            if (updates.containsKey('Description__c')) event.Description__c = (String) updates.get('Description__c');
            if (updates.containsKey('Location__c')) event.Location__c = (String) updates.get('Location__c');
            if (updates.containsKey('Event_Status__c')) event.Event_Status__c = (String) updates.get('Event_Status__c');
            if (updates.containsKey('Max_Volunteers__c')) {
                event.Max_Volunteers__c = Decimal.valueOf(String.valueOf(updates.get('Max_Volunteers__c')));
            }
            if (updates.containsKey('Event_Date__c')) {
                event.Event_Date__c = Date.valueOf(String.valueOf(updates.get('Event_Date__c')));
            }
            
            update event;
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(event));
        } catch (Exception e) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error: ' + e.getMessage()
            }));
        }
    }
    
    @HttpDelete
    global static void deleteEvent() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String eventId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        
        try {
            // Validate ID
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
            
            List<Event__c> events = [SELECT Id FROM Event__c WHERE Id = :eventId LIMIT 1];
            if (events.isEmpty()) {
                res.statusCode = 404;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Event with id ' + eventId + ' not found'
                }));
                return;
            }
            
            delete events[0];
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Event deleted successfully'
            }));
        } catch (Exception e) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error: ' + e.getMessage()
            }));
        }
    }
    
    private static void logActivity(String objectType, String action, String recordId, String details) {
        try {
            History__c history = new History__c();
            history.Schema__c = objectType;
            history.Activity_Type__c = action;
            history.User__c = recordId;
            history.Activity_Response__c = details;
            history.Activity_Timestamp__c = Datetime.now();
            insert history;
        } catch (Exception e) {
            // Silently fail if history logging fails
            System.debug('Failed to log activity: ' + e.getMessage());
        }
    }
}
