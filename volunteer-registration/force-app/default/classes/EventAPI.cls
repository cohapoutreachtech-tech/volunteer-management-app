@RestResource(urlMapping='/api/events/*')
global with sharing class EventAPI {
    
    @HttpGet
    global static void getEvents() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String eventId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        
        try {
            if (eventId != 'events') {
                // Get single event
                Event__c event = [
                    SELECT Id, Name, Title__c, Description__c, Location__c, Event_Date__c, 
                           Event_Time__c, Event_Status__c, Max_Volunteers__c, 
                           Registered_Volunteers__c, Checked_In_Volunteers__c,
                           Image_1_URL__c, Image_2_URL__c, Image_3_URL__c
                    FROM Event__c 
                    WHERE Id = :eventId 
                    LIMIT 1
                ];
                
                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(event));
            } else {
                // Get all events
                List<Event__c> events = [
                    SELECT Id, Name, Title__c, Description__c, Location__c, Event_Date__c, 
                           Event_Time__c, Event_Status__c, Max_Volunteers__c, 
                           Registered_Volunteers__c, Checked_In_Volunteers__c,
                           Image_1_URL__c, Image_2_URL__c, Image_3_URL__c
                    FROM Event__c 
                    ORDER BY Event_Date__c DESC
                ];
                
                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(events));
            }
        } catch (Exception e) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'error' => e.getMessage()
            }));
        }
    }
    
    @HttpPost
    global static void createEvent() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        try {
            String requestBody = req.requestBody.toString();
            Map<String, Object> eventData = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            
            Event__c event = new Event__c();
            event.Title__c = (String) eventData.get('Title__c');
            event.Description__c = (String) eventData.get('Description__c');
            event.Location__c = (String) eventData.get('Location__c');
            event.Event_Status__c = (String) eventData.get('Event_Status__c');
            event.Max_Volunteers__c = eventData.containsKey('Max_Volunteers__c') ? 
                Decimal.valueOf(String.valueOf(eventData.get('Max_Volunteers__c'))) : null;
            
            // Handle dates
            if (eventData.containsKey('Event_Date__c')) {
                String dateString = (String) eventData.get('Event_Date__c');
                event.Event_Date__c = Date.valueOf(dateString);
            }
            
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
                'error' => e.getMessage()
            }));
        }
    }
    
    @HttpPut
    global static void updateEvent() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String eventId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        
        try {
            String requestBody = req.requestBody.toString();
            Map<String, Object> updates = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            
            Event__c event = [SELECT Id FROM Event__c WHERE Id = :eventId LIMIT 1];
            
            // Update fields
            if (updates.containsKey('Title__c')) event.Title__c = (String) updates.get('Title__c');
            if (updates.containsKey('Description__c')) event.Description__c = (String) updates.get('Description__c');
            if (updates.containsKey('Location__c')) event.Location__c = (String) updates.get('Location__c');
            if (updates.containsKey('Event_Status__c')) event.Event_Status__c = (String) updates.get('Event_Status__c');
            if (updates.containsKey('Max_Volunteers__c')) {
                event.Max_Volunteers__c = Decimal.valueOf(String.valueOf(updates.get('Max_Volunteers__c')));
            }
            
            update event;
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(event));
        } catch (Exception e) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'error' => e.getMessage()
            }));
        }
    }
    
    @HttpDelete
    global static void deleteEvent() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String eventId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);
        
        try {
            Event__c event = [SELECT Id FROM Event__c WHERE Id = :eventId LIMIT 1];
            delete event;
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Event deleted successfully'
            }));
        } catch (Exception e) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'error' => e.getMessage()
            }));
        }
    }
}
