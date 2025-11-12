# Volunteer Management API

This repository contains a simple REST API built with Node.js, Express, and MongoDB (Mongoose) for managing Volunteers, Events, and Registrations (shift sign-ups).

Features
- User registration and login (username/password) with JWT-based authentication
- CRUD for Events and Volunteers
- Create / Cancel Registrations with checks: event active, shift exists, capacity

Getting started

1. Copy environment example and set values:

```
cp .env.example .env
# then edit .env to set MONGODB secrets and JWT_SECRET
```

2. Install dependencies:

```
npm run install-all
```

3. Init database with dummy data:

```
npm run init-db
```

API overview

[Join Postman](https://app.getpostman.com/join-team?invite_code=f21d75ffcf9cbd4031b45de86f528aa3260a856a28ed8044f48f02670bb23174&target_code=2d6392d64d8abbbf1fd3d8a08b163a40)

[Mock Server Endpoint](https://41e1dfa2-5dac-4ca8-b135-bfb50c70dcb9.mock.pstmn.io)

Mock endpoints:
- /get-users
- /get-events
- /background-check
- /get-users/1
- /get-events/1

Sex Ofender Registry Background Check
curl --request GET 
	--url 'https://sex-offenders.p.rapidapi.com/sexoffender?firstName=Joseph&lastName=Nigro&zipcode=10465&mode=extensive' 
	--header 'x-rapidapi-host: sex-offenders.p.rapidapi.com' 
	--header 'x-rapidapi-key: <key>'