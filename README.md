# Music Catalog Insights Platform

## Overview

A full-stack album library application. Users register, search the public iTunes catalog through the Spring Boot backend, save albums to a private library, add ratings and notes, view analytics, and optionally generate an AI trend summary.

## Technology Stack

- Frontend: React, Vite, React Router, Axios, Tailwind CSS, Recharts
- Backend: Java 21, Spring Boot, Maven, Spring Security, Spring Data JPA, Bean Validation, JWT, RestClient
- Database: PostgreSQL

## Why Albums Were Chosen

Albums were chosen because they map naturally to the required metadata such as title, artist, genre, release date, track count and artwork, while providing useful data for library analytics.

## Architecture

`React → Spring Boot → PostgreSQL / iTunes / AI`

The browser only communicates with Spring Boot. iTunes search results are proxied and are never stored until a user explicitly adds an album.

## Features

- JWT registration and login with BCrypt password hashes
- Private, user-scoped album libraries with duplicate prevention
- iTunes album search, personalized genre-based album recommendations, library rating/notes editing, and deletion
- Four database-backed charts: genre donut, top artists, library growth, and release years
- Optional OpenAI-compatible AI Library Trend Summary
- Responsive UI with loading, empty, success, and error states

## Database Schema

`users` stores an id, unique email, BCrypt password hash, and creation time. `albums` stores iTunes metadata, optional personal rating/notes, timestamps, and the owning `user_id`. A unique constraint on `(user_id, apple_catalog_id)` prevents duplicates per user.

## API Endpoints

| Method | Endpoint                                | Purpose                            |
| ------ | --------------------------------------- | ---------------------------------- |
| POST   | `/api/auth/register`                    | Register and receive a JWT         |
| POST   | `/api/auth/login`                       | Login and receive a JWT            |
| GET    | `/api/search?query=coldplay&type=album` | Search iTunes albums               |
| GET    | `/api/recommendations`                  | Personalized album recommendations |
| GET    | `/api/library`                          | Current user's albums              |
| POST   | `/api/library`                          | Add an album                       |
| PUT    | `/api/library/{id}`                     | Update rating and notes            |
| DELETE | `/api/library/{id}`                     | Delete an owned album              |
| GET    | `/api/analytics`                        | Current user's chart data          |
| POST   | `/api/ai/insights`                      | Generate AI library summary        |

Protected routes require `Authorization: Bearer <JWT>`.

## Authentication

The backend issues signed JWTs on registration/login. Spring Security extracts the email from the token and always scopes library work to that authenticated user; client-supplied user IDs are never accepted.

## iTunes Integration

Spring Boot calls Apple's public iTunes Search API with `RestClient`, maps only needed fields into DTOs, and returns them to React. Search results are not stored automatically.

## Caching

- Implemented using Spring Cache (`@EnableCaching`, `@Cacheable`) with an in-memory `ConcurrentMap`-backed cache.
- **Only** `/api/search` (iTunes album search) is cached. Library, auth, JWT, analytics, and AI endpoints intentionally bypass the cache.
- **Cache duration:** each search query expires automatically **10 minutes** after it was written. A 60-second background sweep also evicts expired keys so stale entries are never served.
- **Cache key:** `normalized-query|entity` (query is trimmed + lowercased, entity lowercased). "Harry Styles", " harry styles ", and "Harry styles" all share the same entry; "Taylor Swift" gets its own entry.
- Caching prevents repeated round-trips to the iTunes Search API for identical or case/whitespace variants of recent searches, improving response time for repeated searches.
- Logging makes cache behavior visible in the backend logs:
  - First request for a query: `Fetching results from iTunes API... query='...' entity='...'`
  - Subsequent hits within 10 minutes: `Returned search results from cache. cache=itunesSearch, key=...`
  - Periodic cleanup (when applicable): `Evicted N expired entries from cache=itunesSearch`

## Analytics

Analytics are calculated from the authenticated user's saved albums only: a genre donut, a horizontal top-artists bar chart, library-growth line chart, and release-year distribution histogram.

## AI Feature

The optional Library Trend Summary sends a compact aggregate of the current user’s library to Groq. It never sends credentials, JWTs, or unrelated personal information. If it is not configured or fails, the UI shows an error rather than fake content.

## Local Setup

1. Create a Neon PostgreSQL project/database, or use an existing one.
2. Copy `backend/.env.example` to `backend/.env` and fill it in with the Neon connection details. Use a JDBC URL such as `jdbc:postgresql://your-neon-host/neondb?sslmode=require`. The backend loads this local properties-style file automatically (environment variables override it in deployment).
3. In `backend`, run `mvnw.cmd spring-boot:run` on Windows. The first run downloads the Maven runtime; alternatively use an installed Maven with `mvn spring-boot:run`.
4. Copy `frontend/.env.example` to `frontend/.env`.
5. In `frontend`, run `npm install` then `npm run dev` (if PowerShell blocks `npm`, use `npm.cmd install` and `npm.cmd run dev`).

Frontend: `http://localhost:5173` · Backend: `http://localhost:8081`

## Environment Variables

Backend: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS`, `FRONTEND_URL`, `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL`.

Frontend: `VITE_API_BASE_URL`.

## Deployment

Set `FRONTEND_URL` to the deployed frontend origin and `VITE_API_BASE_URL` to the deployed backend URL with `/api` appended. Configure managed PostgreSQL connection values as backend environment variables. Build React with `npm run build`; build Spring Boot with `mvnw.cmd clean package`.

## Trade-offs

Functionality and maintainability were prioritized over excessive complexity because this is a time-boxed take-home assignment. The project uses a simple layered Spring design and a compact client-side React structure rather than microservices or extra state-management frameworks.
