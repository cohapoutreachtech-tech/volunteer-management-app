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
npm install
```

3. Init database with dummy data:

```
npm run init-db
```

API overview

Auth
- POST /auth/register  { username, password, ...other volunteer fields }
- POST /auth/login     { username, password }

Volunteers (protected - send Authorization: Bearer <token>)
- GET /volunteers
- GET /volunteers/:id
- PUT /volunteers/:id
- DELETE /volunteers/:id

Events
- GET /events
- GET /events/:id
- POST /events (protected)
- PUT /events/:id (protected)
- DELETE /events/:id (protected)

Registrations (protected)
- GET /registrations
- POST /registrations  { eventId, shift_time }
- GET /registrations/:id
- DELETE /registrations/:id (owner only)

Notes and assumptions
- The Volunteer model stores password hashed with bcrypt; passwords are not returned in responses.
- Basic auth: any authenticated user can create events in this scaffold (should be restricted to admin in production).
- Event has an `event_id` string and an internal MongoDB _id. You may supply `event_id` or let the server generate one.
- The Registration model references Volunteer and Event by MongoDB ObjectId.

Next steps / improvements
- Add role-based access control (admin vs volunteer)
- Add pagination and filtering for lists
- Add dedicated password change/reset endpoints
- Add tests and CI
