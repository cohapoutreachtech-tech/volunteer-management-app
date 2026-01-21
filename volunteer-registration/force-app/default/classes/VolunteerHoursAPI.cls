@RestResource(urlMapping='/api/volunteerhours/*')
global with sharing class VolunteerHoursAPI {
    
    @HttpGet
    global static void getVolunteerHours() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String requestURI = req.requestURI;
        List<String> uriParts = requestURI.split('/');
        
        try {
            // Check different URL patterns
            if (requestURI.contains('/event/') && requestURI.contains('/volunteer/')) {
                // GET /api/volunteerhours/event/:eventId/volunteer/:volunteerId
                Integer eventIndex = -1;
                Integer volunteerIndex = -1;
                for (Integer i = 0; i < uriParts.size(); i++) {
                    if (uriParts[i] == 'event') eventIndex = i + 1;
                    if (uriParts[i] == 'volunteer') volunteerIndex = i + 1;
                }
                String eventId = uriParts[eventIndex];
                String volunteerId = uriParts[volunteerIndex];
                getShiftsByEventAndVolunteer(eventId, volunteerId, res);
            } else if (requestURI.contains('/volunteer/')) {
                // GET /api/volunteerhours/volunteer/:volunteerId
                String volunteerId = uriParts[uriParts.size() - 1];
                getShiftsByVolunteer(volunteerId, res);
            } else if (requestURI.contains('/event/')) {
                // GET /api/volunteerhours/event/:eventId
                String eventId = uriParts[uriParts.size() - 1];
                getShiftsByEvent(eventId, res);
            } else if (uriParts[uriParts.size() - 1] != 'volunteerhours') {
                // GET /api/volunteerhours/:id
                String shiftId = uriParts[uriParts.size() - 1];
                getShiftById(shiftId, res);
            } else {
                // GET /api/volunteerhours - Get all
                List<VolunteerHours__c> shifts = [
                    SELECT Id, Name, Volunteer__c, Event__c, Shift_Date__c,
                           Clock_In_Time__c, Clock_Out_Time__c, Total_Hours__c,
                           Approval_Status__c, Submitted_Date__c, Notes__c
                    FROM VolunteerHours__c
                    ORDER BY Shift_Date__c DESC, Clock_In_Time__c DESC
                ];
                
                logActivity('VolunteerHours', 'get', UserInfo.getUserId(), 'All shifts retrieved');
                
                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(shifts));
            }
        } catch (Exception e) {
            logActivity('VolunteerHours', 'get', UserInfo.getUserId(), e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error.'
            }));
        }
    }
    
    private static void getShiftById(String shiftId, RestResponse res) {
        // Validate ID
        if (ValidationUtils.isEmptyOrPlaceholder(shiftId)) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'volunteer hours id should not be empty'
            }));
            return;
        }
        
        if (!ValidationUtils.isValidSalesforceId(shiftId)) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Invalid volunteer hours id format'
            }));
            return;
        }
        
        List<VolunteerHours__c> shifts = [
            SELECT Id, Name, Volunteer__c, Event__c, Shift_Date__c,
                   Clock_In_Time__c, Clock_Out_Time__c, Total_Hours__c,
                   Approval_Status__c, Submitted_Date__c, Notes__c
            FROM VolunteerHours__c
            WHERE Id = :shiftId
            LIMIT 1
        ];
        
        if (shifts.isEmpty()) {
            logActivity('VolunteerHours', 'get', UserInfo.getUserId(), 
                'VolunteerHours ' + shiftId + ' not found');
            res.statusCode = 404;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'VolunteerHours ' + shiftId + ' not found'
            }));
            return;
        }
        
        logActivity('VolunteerHours', 'get', UserInfo.getUserId(), 
            'VolunteerHours ' + shiftId + ' retrieved');
        
        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(shifts[0]));
    }
    
    private static void getShiftsByEvent(String eventId, RestResponse res) {
        // Validate event ID
        if (ValidationUtils.isEmptyOrPlaceholder(eventId)) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Invalid event id'
            }));
            return;
        }
        
        if (!ValidationUtils.isValidSalesforceId(eventId)) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Invalid event id'
            }));
            return;
        }
        
        List<VolunteerHours__c> shifts = [
            SELECT Id, Name, Volunteer__c, Event__c, Shift_Date__c,
                   Clock_In_Time__c, Clock_Out_Time__c, Total_Hours__c,
                   Approval_Status__c, Submitted_Date__c, Notes__c
            FROM VolunteerHours__c
            WHERE Event__c = :eventId
            ORDER BY Shift_Date__c DESC, Clock_In_Time__c DESC
        ];
        
        logActivity('VolunteerHours', 'get', UserInfo.getUserId(), 
            'Shifts for event ' + eventId + ' retrieved');
        
        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(shifts));
    }
    
    private static void getShiftsByVolunteer(String volunteerId, RestResponse res) {
        // Validate volunteer ID
        if (ValidationUtils.isEmptyOrPlaceholder(volunteerId)) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Invalid volunteer id'
            }));
            return;
        }
        
        if (!ValidationUtils.isValidSalesforceId(volunteerId)) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Invalid volunteer id'
            }));
            return;
        }
        
        List<VolunteerHours__c> shifts = [
            SELECT Id, Name, Volunteer__c, Event__c, Shift_Date__c,
                   Clock_In_Time__c, Clock_Out_Time__c, Total_Hours__c,
                   Approval_Status__c, Submitted_Date__c, Notes__c
            FROM VolunteerHours__c
            WHERE Volunteer__c = :volunteerId
            ORDER BY Shift_Date__c DESC, Clock_In_Time__c DESC
        ];
        
        logActivity('VolunteerHours', 'get', UserInfo.getUserId(), 
            'Shifts for volunteer ' + volunteerId + ' retrieved');
        
        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(shifts));
    }
    
    private static void getShiftsByEventAndVolunteer(String eventId, String volunteerId, RestResponse res) {
        // Validate IDs
        if (ValidationUtils.isEmptyOrPlaceholder(eventId) || ValidationUtils.isEmptyOrPlaceholder(volunteerId)) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Invalid event id or volunteer id'
            }));
            return;
        }
        
        if (!ValidationUtils.isValidSalesforceId(eventId) || !ValidationUtils.isValidSalesforceId(volunteerId)) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Invalid event id or volunteer id'
            }));
            return;
        }
        
        List<VolunteerHours__c> shifts = [
            SELECT Id, Name, Volunteer__c, Event__c, Shift_Date__c,
                   Clock_In_Time__c, Clock_Out_Time__c, Total_Hours__c,
                   Approval_Status__c, Submitted_Date__c, Notes__c
            FROM VolunteerHours__c
            WHERE Event__c = :eventId AND Volunteer__c = :volunteerId
            ORDER BY Shift_Date__c DESC, Clock_In_Time__c DESC
        ];
        
        logActivity('VolunteerHours', 'get', UserInfo.getUserId(), 
            'Shifts for event ' + eventId + ' and volunteer ' + volunteerId + ' retrieved');
        
        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(shifts));
    }
    
    @HttpPost
    global static void createShift() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        try {
            String requestBody = req.requestBody.toString();
            Map<String, Object> shiftData = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            
            // Validate required fields
            if (!shiftData.containsKey('Volunteer__c') || 
                !shiftData.containsKey('Shift_Date__c') || 
                !shiftData.containsKey('Clock_In_Time__c')) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Volunteer__c, Shift_Date__c and Clock_In_Time__c are required.'
                }));
                return;
            }
            
            // Validate Volunteer ID
            String volunteerId = (String) shiftData.get('Volunteer__c');
            if (!ValidationUtils.isValidSalesforceId(volunteerId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid Volunteer__c format'
                }));
                return;
            }
            
            // Validate Event ID if provided
            if (shiftData.containsKey('Event__c') && shiftData.get('Event__c') != null) {
                String eventId = (String) shiftData.get('Event__c');
                if (!ValidationUtils.isValidSalesforceId(eventId)) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'message' => 'Invalid Event__c format'
                    }));
                    return;
                }
            }
            
            // Create shift
            VolunteerHours__c shift = new VolunteerHours__c();
            shift.Volunteer__c = volunteerId;
            
            if (shiftData.containsKey('Event__c') && shiftData.get('Event__c') != null) {
                shift.Event__c = (String) shiftData.get('Event__c');
            }
            
            // Parse dates and times
            String shiftDateStr = (String) shiftData.get('Shift_Date__c');
            shift.Shift_Date__c = Date.valueOf(shiftDateStr.substring(0, 10));
            
            String clockInStr = (String) shiftData.get('Clock_In_Time__c');
            shift.Clock_In_Time__c = Datetime.valueOf(clockInStr.replace('T', ' ').replace('Z', ''));
            
            if (shiftData.containsKey('Clock_Out_Time__c') && shiftData.get('Clock_Out_Time__c') != null) {
                String clockOutStr = (String) shiftData.get('Clock_Out_Time__c');
                shift.Clock_Out_Time__c = Datetime.valueOf(clockOutStr.replace('T', ' ').replace('Z', ''));
                
                // Calculate total hours
                Long millisDiff = shift.Clock_Out_Time__c.getTime() - shift.Clock_In_Time__c.getTime();
                Decimal hours = millisDiff / (1000.0 * 60 * 60);
                shift.Total_Hours__c = hours.setScale(2);
            } else {
                shift.Total_Hours__c = 0;
            }
            
            shift.Submitted_Date__c = System.now();
            shift.Approval_Status__c = 'Pending';
            
            if (shiftData.containsKey('Notes__c')) {
                shift.Notes__c = (String) shiftData.get('Notes__c');
            }
            
            insert shift;
            
            logActivity('VolunteerHours', 'create', UserInfo.getUserId(), 
                'VolunteerHours ' + shift.Id + ' created');
            
            res.statusCode = 201;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                'message' => 'VolunteerHours ' + shift.Id + ' created',
                'shift' => shift
            }));
        } catch (Exception e) {
            logActivity('VolunteerHours', 'create', UserInfo.getUserId(), e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error.'
            }));
        }
    }
    
    @HttpPut
    global static void updateShift() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String shiftId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        
        try {
            // Validate ID
            if (ValidationUtils.isEmptyOrPlaceholder(shiftId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'volunteer hours id should not be empty'
                }));
                return;
            }
            
            if (!ValidationUtils.isValidSalesforceId(shiftId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid volunteer hours id format'
                }));
                return;
            }
            
            String requestBody = req.requestBody.toString();
            Map<String, Object> updates = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            
            // Check if any updatable fields provided
            Set<String> allowedFields = new Set<String>{'Shift_Date__c', 'Clock_In_Time__c', 'Clock_Out_Time__c', 'Notes__c'};
            Boolean hasUpdates = false;
            for (String field : allowedFields) {
                if (updates.containsKey(field)) {
                    hasUpdates = true;
                    break;
                }
            }
            
            if (!hasUpdates) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'No updatable fields provided.'
                }));
                return;
            }
            
            // Fetch existing shift
            List<VolunteerHours__c> shifts = [
                SELECT Id, Clock_In_Time__c, Clock_Out_Time__c 
                FROM VolunteerHours__c 
                WHERE Id = :shiftId 
                LIMIT 1
            ];
            
            if (shifts.isEmpty()) {
                logActivity('VolunteerHours', 'update', UserInfo.getUserId(), 
                    'VolunteerHours ' + shiftId + ' not found');
                res.statusCode = 404;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'VolunteerHours ' + shiftId + ' not found'
                }));
                return;
            }
            
            VolunteerHours__c shift = shifts[0];
            
            // Update fields
            if (updates.containsKey('Shift_Date__c')) {
                String shiftDateStr = (String) updates.get('Shift_Date__c');
                shift.Shift_Date__c = Date.valueOf(shiftDateStr.substring(0, 10));
            }
            
            if (updates.containsKey('Clock_In_Time__c')) {
                String clockInStr = (String) updates.get('Clock_In_Time__c');
                shift.Clock_In_Time__c = Datetime.valueOf(clockInStr.replace('T', ' ').replace('Z', ''));
            }
            
            if (updates.containsKey('Clock_Out_Time__c')) {
                String clockOutStr = (String) updates.get('Clock_Out_Time__c');
                shift.Clock_Out_Time__c = Datetime.valueOf(clockOutStr.replace('T', ' ').replace('Z', ''));
            }
            
            if (updates.containsKey('Notes__c')) {
                shift.Notes__c = (String) updates.get('Notes__c');
            }
            
            // Recalculate total hours if times changed
            if (shift.Clock_In_Time__c != null && shift.Clock_Out_Time__c != null) {
                Long millisDiff = shift.Clock_Out_Time__c.getTime() - shift.Clock_In_Time__c.getTime();
                Decimal hours = millisDiff / (1000.0 * 60 * 60);
                shift.Total_Hours__c = hours.setScale(2);
            }
            
            shift.Submitted_Date__c = System.now();
            
            update shift;
            
            logActivity('VolunteerHours', 'update', UserInfo.getUserId(), 
                'VolunteerHours ' + shiftId + ' updated');
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                'message' => 'VolunteerHours ' + shiftId + ' updated',
                'shift' => shift
            }));
        } catch (Exception e) {
            logActivity('VolunteerHours', 'update', UserInfo.getUserId(), e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error.'
            }));
        }
    }
    
    @HttpDelete
    global static void deleteShift() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String shiftId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        
        try {
            // Validate ID
            if (ValidationUtils.isEmptyOrPlaceholder(shiftId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'volunteer hours id should not be empty'
                }));
                return;
            }
            
            if (!ValidationUtils.isValidSalesforceId(shiftId)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid volunteer hours id format'
                }));
                return;
            }
            
            List<VolunteerHours__c> shifts = [
                SELECT Id FROM VolunteerHours__c WHERE Id = :shiftId LIMIT 1
            ];
            
            if (shifts.isEmpty()) {
                logActivity('VolunteerHours', 'delete', UserInfo.getUserId(), 
                    'VolunteerHours ' + shiftId + ' not found');
                res.statusCode = 404;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'VolunteerHours ' + shiftId + ' not found'
                }));
                return;
            }
            
            VolunteerHours__c shift = shifts[0];
            delete shift;
            
            logActivity('VolunteerHours', 'delete', UserInfo.getUserId(), 
                'VolunteerHours ' + shiftId + ' deleted');
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'VolunteerHours ' + shiftId + ' deleted'
            }));
        } catch (Exception e) {
            logActivity('VolunteerHours', 'delete', UserInfo.getUserId(), e.getMessage());
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
