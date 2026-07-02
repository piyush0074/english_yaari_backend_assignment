# Session Booking API

A REST API where users book sessions with teachers. Teachers create available
sessions, users book them, and completed sessions appear in each user's history.

Built with **Node.js, TypeScript, Express.js, MongoDB, and Mongoose**, using a
**layered / command-pattern architecture** (entrypoint → factory → server
singleton → loaders → routes → controllers → services → models).

---

## Tech Stack

| Concern       | Choice                         |
| ------------- | ------------------------------ |
| Runtime       | Node.js                        |
| Language      | TypeScript                     |
| Web framework | Express.js                     |
| Database      | MongoDB                        |
| ODM           | Mongoose                       |
| Validation    | Joi                            |
| Logging       | winston                        |
| Config        | dotenv (environment variables) |

---

## Architecture

The request lifecycle flows through clear layers, each with a single
responsibility:

```
app.ts                      Bootstrap: process guards → Factory → server.start()
  └─ Factory.ts             Composition root: builds Express app + DB loader
       └─ loaders/Server    Singleton: wires middleware, routes, error handler, listens
            ├─ loaders/MongoDB   Owns the Mongoose connection + generic data-access helpers
            ├─ loaders/Logger    winston logger
            └─ api/index         Mounts feature routers under config.api.prefix
                 └─ api/routes/*         Route definitions + Joi validation middleware
                      └─ controller/*    One class per use-case (execute(req,res))
                           └─ controller/service/*   Business logic + aggregation pipelines
                                └─ repository/*      Data-access contracts + Mongo implementations
                                     └─ Model/*      Mongoose schemas
```

Two `core/` abstractions keep every response and error uniform:

- **`core/APIresponse.ts`** — an `ApiResponse` class hierarchy
  (`SuccessResponse`, `CreatedResponse`, `BadRequestResponse`,
  `NotFoundResponse`, `ConflictResponse`, …). Controllers call
  `new SuccessResponse(msg, data).send(res)` — never build ad-hoc bodies.
- **`core/APIerror.ts`** — an `ApiError` class hierarchy (`BadRequestError`,
  `NotFoundError`, `ConflictError`, …) with a static `handle()` that maps each
  error type to the matching response. Services/controllers just
  `throw new NotFoundError(...)`; the Server's error middleware handles the rest.

### Project Structure

```
src/
├── app.ts                       # Entrypoint + process-level error guards
├── Factory.ts                   # Composition root (builds app + loaders)
├── config/
│   └── index.ts                 # Single default-exported config object
├── core/
│   ├── APIresponse.ts           # Uniform response classes (.send(res))
│   ├── APIerror.ts              # Typed error classes + handle() mapping
│   ├── asyncHandler.ts          # Forwards async errors to central handler
│   └── types.d.ts               # Express Request augmentation (req.id, req.auth)
├── loaders/
│   ├── Server.ts                # Singleton: middleware, routes, error handler
│   ├── MongoDB.ts               # Connection + create/find/aggregate helpers
│   └── Logger.ts                # winston
├── Model/
│   ├── index.ts                 # registerModels() (called on DB init)
│   ├── User.ts                  # User schema (email unique)
│   ├── Teacher.ts               # Teacher schema
│   └── Session.ts               # Session schema + SessionStatus enum
├── interface/
│   └── IAPIParams.ts            # Typed request-payload shapes
├── api/
│   ├── index.ts                 # Router registry
│   ├── routes/                  # User.ts, Teacher.ts, Session.ts
│   └── middleware/
│       ├── Auth.ts              # Header-based actor auth / role guard
│       └── Validation.ts        # Joi validation middlewares
├── controller/
│   ├── user/                    # CreateUser, GetUserSessions
│   ├── teacher/                 # CreateTeacher
│   ├── session/                 # CreateSession, AvailableSessions, BookSession, CompleteSession
│   └── service/                 # UserService, TeacherService, SessionService
└── repository/
    ├── interfaces/              # IUserRepository, ITeacherRepository, ISessionRepository
    └── mongo/                   # Mongo-backed repository implementations
```

Supporting project files:

```
.
├── .env.example                 # Environment variable template
├── package.json                 # Scripts and dependencies
├── package-lock.json            # Locked dependency graph
├── postman_collection.json      # Postman collection for manual API checks
├── tsconfig.json                # TypeScript compiler options
├── LICENSE
└── README.md
```

---

## Setup

### 1. Prerequisites

- Node.js 18+ (developed on Node 24)
- A running MongoDB instance (local `mongod` or MongoDB Atlas)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

| Variable               | Description                                   | Default                                     |
| ---------------------- | --------------------------------------------- | ------------------------------------------- |
| `PORT`                 | HTTP port                                     | `3000`                                       |
| `NODE_ENV`             | `development` / `production`                   | `development`                                |
| `LOG_LEVEL`            | winston log level                             | `debug`                                      |
| `API_PREFIX`           | Prefix for all feature routes (empty = bare)  | `/api`                                       |
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins, or `*`               | `*`                                          |
| `MONGO_URI`            | MongoDB connection string                     | `mongodb://127.0.0.1:27017/session-booking`  |

### 4. Run

```bash
npm run dev            # development, auto-reload
# or
npm run build && npm start
```

Server logs `Server listening on http://localhost:3000`. Health check: `GET /health`.

> **Route prefix:** all feature routes are mounted under `API_PREFIX` (default
> `/api`), so the endpoints below are e.g. `POST /api/users`. To use the
> assignment's bare paths (`POST /users`), set `API_PREFIX=` in `.env`.

---

## Response Envelope

```jsonc
// success
{ "success": true, "message": "…", "data": { … } }
// error
{ "success": false, "message": "…" }
```

---

## API Reference

Base URL: `http://localhost:3000/api`

### Helper — Create Teacher

`POST /api/teachers` — seed a teacher so sessions can be created/validated
(Teacher schema is in the spec; no create route was mandated).

```json
{ "fullName": "Dr. Jane Smith", "email": "jane@example.com", "specialization": "Mathematics", "experience": 8 }
```
`201` → created teacher (use its `_id` as `teacherId`).

### API 1 — Create User

`POST /api/users` — email must be unique.

```json
{ "fullName": "John Doe", "email": "john@example.com", "phone": "+1-555-0100" }
```
`201` created · `409` duplicate email · `400` invalid input.

### API 2 — Create Session

`POST /api/sessions` — default status `AVAILABLE`; validates teacher exists and `endTime > startTime`.

```json
{ "teacherId": "<teacher _id>", "startTime": "2026-07-10T09:00:00.000Z", "endTime": "2026-07-10T10:00:00.000Z" }
```
`201` created · `404` teacher missing · `400` `endTime <= startTime` / invalid.

### API 3 — Available Sessions for Booking

`GET /api/sessions/available?dateTimestamp={timestamp}` — all `AVAILABLE`
sessions whose `startTime` falls on the supplied date. **MongoDB Aggregation
Pipeline** (`$match` UTC day range → `$lookup` teacher → `$sort` → `$project`).

- `dateTimestamp` = **epoch milliseconds**; the day is resolved in **UTC**
  (`[startOfDayUTC, nextDayUTC)`).

`200` → `{ data: { count, date: { from, to }, sessions: [...] } }`.

### API 4 — Book Session

`POST /api/sessions/:id/book`

```json
{ "userId": "<user _id>" }
```
Rules: user exists, session exists, only `AVAILABLE` bookable, no double-booking
(guarded atomically via `findOneAndUpdate`). On success status → `BOOKED`, user
associated. `200` · `404` user/session missing · `409` not available.

Concurrency behavior (same-time booking attempts): if two students send booking
requests for the same session at nearly the same moment, both requests may read
the session as `AVAILABLE`, but only one `findOneAndUpdate` can match
`{ _id, status: AVAILABLE }`. The first update books the session; the second
update matches zero documents and returns `409` ("Session was just booked by
someone else").

### API 5 — Mark Session Complete

`PATCH /api/sessions/:id/complete` — only `BOOKED` → `COMPLETED`, sets
`completedAt`. `200` · `404` missing · `409` not `BOOKED`.

### API 6 — User Session List

`GET /api/users/:id/sessions` — user's sessions split into **Upcoming**
(`BOOKED`) and **Completed** (`COMPLETED`). **MongoDB Aggregation Pipeline**
(`$lookup` teacher + `$facet` for both buckets in one query).

`200` → `{ data: { upcomingSessions: [...], completedSessions: [...] } }` · `404` user missing.

---

## Design Notes

- **Layered architecture** — routes handle HTTP + validation, controllers
  orchestrate, services own business logic and data access, models define
  schemas. Infrastructure lives in `loaders/` and is assembled by `Factory`.
- **Aggregation pipelines** (mandatory) power API 3 and API 6; API 6 uses
  `$facet` to return both buckets in one round-trip.
- **Centralized error handling** — a single middleware maps `ApiError`
  subclasses and Mongoose validation/cast/duplicate-key (`E11000`) errors to
  uniform responses. Controllers just `throw`; `asyncHandler` forwards async
  rejections.
- **Async/await only** — no callback-style handlers.
- **Atomic state transitions** — booking/completion use `findOneAndUpdate` with
  the expected current status in the filter, preventing double-book / double-complete.
- **Config-driven** — one `config` object; model names come from a registry
  (`config.mongo.models`) rather than string literals.
- **HTTP status codes** — `201` create, `200` read/mutation, `400` validation,
  `404` not found, `409` conflict, `500` unexpected.

---

## Postman Collection

Import `postman_collection.json`. Requests are ordered as a flow (create teacher
→ user → session → available → book → complete → user sessions) and
auto-populate collection variables (`baseUrl`, `apiPrefix`, `teacherId`,
`userId`, `sessionId`) from responses, so you can run them top to bottom.
