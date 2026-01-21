@RestResource(urlMapping='/api/auth/login')
global without sharing class AuthAPI {
    
    @HttpPost
    global static void login() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        try {
            String requestBody = req.requestBody.toString();
            Map<String, Object> credentials = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            
            // Accept both formats: "email" or "Email__c", "password" or "Pass_Hash__c"
            String email = credentials.containsKey('email') ? 
                (String) credentials.get('email') : (String) credentials.get('Email__c');
            String password = credentials.containsKey('password') ? 
                (String) credentials.get('password') : (String) credentials.get('Pass_Hash__c');
            
            // Validate inputs
            if (String.isBlank(email) || String.isBlank(password)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Email and password are required'
                }));
                return;
            }
            
            // Validate email format
            if (!ValidationUtils.isValidEmail(email)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid email format'
                }));
                return;
            }
            
            // Query volunteer by email
            List<Volunteer__c> volunteers = [
                SELECT Id, Name, First_Name__c, Last_Name__c, Email__c, Pass_Hash__c, Status__c
                FROM Volunteer__c 
                WHERE Email__c = :email 
                LIMIT 1
            ];
            
            if (volunteers.isEmpty()) {
                res.statusCode = 401;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid credentials'
                }));
                return;
            }
            
            Volunteer__c volunteer = volunteers[0];
            
            // Check volunteer status
            if (volunteer.Status__c == 'Inactive' || volunteer.Status__c == 'Suspended') {
                res.statusCode = 403;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Account is ' + volunteer.Status__c
                }));
                return;
            }
            
            // Verify password using hashing
            if (!PasswordUtils.verifyPassword(password, volunteer.Pass_Hash__c)) {
                res.statusCode = 401;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid credentials'
                }));
                return;
            }
            
            // Generate JWT token
            String token = JWTUtils.generateToken(volunteer.Id, volunteer.Email__c);
            
            // Log activity
            logActivity('Auth', 'login', volunteer.Id, 'Login successful | user_id: ' + volunteer.Id);
            
            // Return success with token
            Map<String, Object> response = new Map<String, Object>{
                'token' => token,
                'volunteer' => new Map<String, String>{
                    'id' => volunteer.Id,
                    'name' => volunteer.Name,
                    'email' => volunteer.Email__c,
                    'firstName' => volunteer.First_Name__c,
                    'lastName' => volunteer.Last_Name__c,
                    'status' => volunteer.Status__c
                },
                'message' => 'Login successful'
            };
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(response));
            
        } catch (Exception e) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error: ' + e.getMessage()
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
