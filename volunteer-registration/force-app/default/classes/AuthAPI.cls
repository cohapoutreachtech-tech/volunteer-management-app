@RestResource(urlMapping='/api/auth/login')
global without sharing class AuthAPI {
    @HttpPost
    global static void login() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        System.debug('AuthAPI.login: Incoming request: ' + req.requestURI);
        System.debug('AuthAPI.login: Headers: ' + req.headers);
        try {
            String requestBody = req.requestBody != null ? req.requestBody.toString() : '';
            System.debug('AuthAPI.login: requestBody = ' + requestBody);
            Map<String, Object> credentials = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            String email = credentials.containsKey('email') ? 
                (String) credentials.get('email') : (String) credentials.get('Email__c');
            String password = credentials.containsKey('password') ? 
                (String) credentials.get('password') : (String) credentials.get('Pass_Hash__c');
            System.debug('AuthAPI.login: email = ' + email);
            if (String.isBlank(email) || String.isBlank(password)) {
                System.debug('AuthAPI.login: Email or password is blank');
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Email and password are required'
                }));
                return;
            }
            if (!ValidationUtils.isValidEmail(email)) {
                System.debug('AuthAPI.login: Invalid email format');
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid email format'
                }));
                return;
            }
            System.debug('AuthAPI.login: Querying volunteer by email');
            List<Volunteer__c> volunteers = [
                SELECT Id, Name, First_Name__c, Last_Name__c, Email__c, Pass_Hash__c, Status__c
                FROM Volunteer__c 
                WHERE Email__c = :email 
                LIMIT 1
            ];
            System.debug('AuthAPI.login: Query result size: ' + volunteers.size());
            if (volunteers.isEmpty()) {
                System.debug('AuthAPI.login: No volunteer found for email');
                res.statusCode = 401;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid credentials'
                }));
                return;
            }
            Volunteer__c volunteer = volunteers[0];
            if (volunteer.Status__c == 'Inactive' || volunteer.Status__c == 'Suspended') {
                System.debug('AuthAPI.login: Volunteer status is ' + volunteer.Status__c);
                res.statusCode = 403;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Account is ' + volunteer.Status__c
                }));
                return;
            }
            if (!PasswordUtils.verifyPassword(password, volunteer.Pass_Hash__c)) {
                System.debug('AuthAPI.login: Password verification failed');
                res.statusCode = 401;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'message' => 'Invalid credentials'
                }));
                return;
            }
            String token = JWTUtils.generateToken(volunteer.Id, volunteer.Email__c);
            System.debug('AuthAPI.login: JWT token generated');
            logActivity('Auth', 'login', String.valueOf(volunteer.Id), 'Login successful | user_id: ' + volunteer.Id);
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
            System.debug('AuthAPI.login: Exception: ' + e.getMessage() + '\n' + e.getStackTraceString());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'message' => 'Server error: ' + e.getMessage()
            }));
        }
    }
    
    // Helper method to log activities
    global static void logActivity(String schema, String activityType, String userId, String response) {
        try {
            History__c history = new History__c();
            history.Schema__c = schema;
            history.Activity_Type__c = activityType;
            history.User__c = userId;
            history.Activity_Response__c = response;
            history.Activity_Timestamp__c = System.now();
            insert history;
        } catch (Exception e) {
            System.debug('AuthAPI.logActivity: Failed to log activity: ' + e.getMessage());
        }
    }
}
