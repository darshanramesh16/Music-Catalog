# Music Catalog Insights Platform

![Java 21](https://img.shields.io/badge/Java-21-blue?logo=java)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.5-6DB33F?logo=spring-boot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-secure-orange?logo=json-web-tokens&logoColor=white)
![MIT License](https://img.shields.io/badge/license-MIT-green)

Music Catalog Insights Platform is a full-stack web application for exploring albums, building a personal library, and reviewing personal music trends. Users can search albums through the iTunes API, save them to a private library, add ratings and notes, view analytics, generate an AI-backed trend summary, and authenticate securely with JWT.

The project is organized as a React frontend and a Spring Boot backend connected to PostgreSQL. The backend acts as the gateway to iTunes search results and the application’s own library and analytics data, while the frontend provides search, library, recommendations, and analytics in a single responsive interface.

## Table of Contents

- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Why Albums](#why-albums)
- [Database Choice](#database-choice)
- [Database Schema](#database-schema)
- [System Architecture](#system-architecture)
- [Application Flow](#application-flow)
- [REST APIs](#rest-apis)
- [Analytics](#analytics)
- [AI Feature](#ai-feature)
- [Recommendations](#recommendations)
- [Recommendation Feature](#recommendation-feature)
- [Good to Have Features](#good-to-have-features)
- [Security](#security)
- [Setup](#setup)
- [Running](#running)
- [Deployment](#deployment)
- [Trade-offs](#trade-offs)
- [Future Improvements](#future-improvements)
- [Screenshots](#screenshots)
- [License](#license)

## Live Demo

- Frontend: `<FRONTEND_RENDER_URL>`
- Backend: `<BACKEND_RENDER_URL>`

## Features

### Authentication

- User registration and login
- JWT-based authentication for protected routes
- Password hashing with BCrypt
- Authorization header support for protected API requests

### Search

- Search albums by title or artist via the iTunes Search API
- Debounced search input in the frontend
- Client-side pagination for search results
- Search summary showing the current page range and total results

### Recommendations

- Personalized recommendations based on the user’s saved album genres
- Queries the iTunes Search API for genre-based album matches
- Filters out albums already saved in the library
- Returns up to eight recommended albums with a reason message
- Recommendations are separate from AI Trend Summary

### Library Management

- Save albums into a private library
- Prevent duplicate albums per user
- Edit a saved album’s rating and notes
- Delete albums from the library

### Analytics

- View charts based on the authenticated user’s saved albums
- Albums by genre — Donut Chart
- Top artists — Horizontal Bar Chart
- Release-year distribution — Vertical Bar Chart
- Tracks per album — Horizontal Bar Chart

### AI

- Generate an AI Trend Summary from saved library data
- Uses a Groq-compatible OpenAI endpoint when configured
- Insights are generated from available data only and do not invent facts

### Performance and Quality

- In-memory caching for repeated iTunes search requests
- Consistent loading, empty, error, and success states in the UI
- Unit tests for backend services and frontend pages/components

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Recharts
- CSS with Tailwind-compatible styling setup

### Backend

- Java 21
- Spring Boot 3.4.x
- Spring Web
- Spring Security
- Spring Data JPA
- Spring Validation
- JWT authentication with jjwt
- RestClient for external API calls
- Maven

### Database

- PostgreSQL

### Charts

- Recharts

### AI

- Groq-compatible OpenAI endpoint via Spring RestClient

### Testing

- Backend: JUnit 5 and Spring Boot test support
- Frontend: Vitest and React Testing Library

## Project Structure

```text
backend/
  src/main/java/com/musiccatalog/
    config/
    controller/
    dto/
    entity/
    exception/
    repository/
    security/
    service/
  src/test/java/
frontend/
  src/
    components/
    hooks/
    layouts/
    pages/
    routes/
    test/
    utils/
```

## Why Albums?

Albums were chosen because they provide richer metadata than songs or individual artists, including title, artist, genre, release date, track count, artwork, and user-defined ratings and notes. This makes albums a strong fit for library management, personalized recommendations, and analytics.

## Database Choice

PostgreSQL was selected because the application uses relational data with clear relationships between users and albums. It provides ACID transactions, reliable querying, and smooth integration with Spring Boot and JPA.

## Database Schema

### User

| Field      | Type      | Notes                           |
| ---------- | --------- | ------------------------------- |
| id         | bigint    | Primary key                     |
| email      | varchar   | Unique, used for authentication |
| password   | varchar   | BCrypt-hashed password          |
| created_at | timestamp | Creation time                   |

### Album

| Field            | Type      | Notes                            |
| ---------------- | --------- | -------------------------------- |
| id               | bigint    | Primary key                      |
| apple_catalog_id | bigint    | External iTunes album identifier |
| title            | varchar   | Album title                      |
| artist_name      | varchar   | Artist name                      |
| genre            | varchar   | Genre                            |
| release_date     | date      | Release date                     |
| track_count      | int       | Track count                      |
| artwork_url      | varchar   | Album artwork URL                |
| user_rating      | int       | Optional user rating             |
| user_notes       | varchar   | Optional user notes              |
| user_id          | bigint    | Owning user                      |
| created_at       | timestamp | Creation timestamp               |
| updated_at       | timestamp | Last update timestamp            |

A unique constraint on `(user_id, apple_catalog_id)` prevents the same album from being saved multiple times by the same user.

## System Architecture

```mermaid
graph TD
  A[React Frontend]
  B[Spring Boot Backend]
  C[(PostgreSQL)]
  D[iTunes Search API]
  E[Groq AI]

  A --> B
  B --> D
  B --> C
  B --> E
```

The React frontend communicates with the Spring Boot backend for search, recommendations, library management, analytics, and AI insights. The backend stores user library data in PostgreSQL, proxies album search requests to iTunes, and forwards analytics facts to the configured AI endpoint.

## Application Flow

```text
User logs in
  ↓
Frontend sends requests to Spring Boot backend
  ↓
Search queries go to iTunes through the backend
  ↓
Saved albums are stored in PostgreSQL
  ↓
Analytics and recommendations are generated from saved albums
  ↓
AI Trend Summary is produced from library facts
```

## REST APIs

| Method | Endpoint                           | Purpose                                                 |
| ------ | ---------------------------------- | ------------------------------------------------------- |
| POST   | `/api/auth/register`               | Register a new user and receive a JWT                   |
| POST   | `/api/auth/login`                  | Authenticate and receive a JWT                          |
| GET    | `/api/search?query=...&type=album` | Search albums through iTunes                            |
| GET    | `/api/recommendations`             | Fetch recommendations based on the user’s saved library |
| GET    | `/api/library`                     | List the current user’s saved albums                    |
| POST   | `/api/library`                     | Save an album to the user’s library                     |
| PUT    | `/api/library/{id}`                | Update an album’s rating and notes                      |
| DELETE | `/api/library/{id}`                | Delete an album from the library                        |
| GET    | `/api/analytics`                   | Retrieve analytics data for the current user            |
| POST   | `/api/ai/insights`                 | Generate an AI trend summary from saved albums          |

All protected endpoints require a JWT in the `Authorization: Bearer <token>` header.

## Analytics

Analytics are generated from the authenticated user’s saved albums and rendered using Recharts. The current frontend includes:

- Albums by genre — Donut Chart
- Top artists — Horizontal Bar Chart
- Release-year distribution — Vertical Bar Chart
- Tracks per album — Horizontal Bar Chart

The analytics panel also includes a separate AI Trend Summary section for text-based insights.

## AI Feature

The AI Trend Summary analyzes the authenticated user’s saved library and creates concise bullet-style insights from the available data. It:

- analyzes saved albums from the user’s library
- identifies genre trends and top artists
- identifies release-year patterns
- considers track count distribution and ratings when available
- composes those facts into a Groq-compatible prompt
- returns a summary generated only from available data

This feature is enabled when `AI_API_KEY` and `AI_BASE_URL` are configured for a compatible Groq endpoint.

## Recommendation Feature

Recommendations are generated from the saved library. The feature:

- reads the user’s saved albums
- extracts the most frequent genres
- queries the iTunes Search API for albums matching each genre
- filters out albums already saved by the user
- returns up to eight recommended albums with a genre-based reason

This approach uses existing genre preferences for album discovery and differs from the AI Trend Summary by focusing on recommendations rather than analytics.

## Good to Have Features

- Debounced search input to reduce unnecessary API calls
- Client-side pagination for search results
- Personalized recommendation cards with genre-based reasons
- Separate AI Trend Summary panel
- In-memory caching for repeated iTunes search queries
- Clear loading, empty, and error states in the UI
- Backend and frontend tests for key flows

## Security

Spring Security and JWT authentication protect the backend API. Passwords are stored with BCrypt, and protected routes validate bearer tokens before allowing access.

## Setup

### Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Configure your PostgreSQL connection variables and JWT settings.
3. Install dependencies and run the server:

```bash
cd backend
./mvnw spring-boot:run
```

On Windows:

```powershell
cd backend
mvnw.cmd spring-boot:run
```

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Install dependencies:

```bash
cd frontend
npm install
```

### Environment Variables

#### Backend

- `DATABASE_URL`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION_MS`
- `FRONTEND_URL`
- `AI_API_KEY`
- `AI_MODEL`
- `AI_BASE_URL`

#### Frontend

- `VITE_API_BASE_URL`

## Running

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend
npm run dev
```

### Testing

#### Backend

```bash
cd backend
./mvnw test
```

#### Frontend

```bash
cd frontend
npm run test
```

## Deployment

Frontend (Render):

`<FRONTEND_RENDER_URL>`

Backend API (Render):

`<BACKEND_RENDER_URL>`

Database:

Render PostgreSQL

## Trade-offs

This implementation favors clarity and maintainability over complexity. PostgreSQL was chosen for structured relational data, in-memory caching keeps the backend simple, and client-side search pagination avoids introducing server-side pagination logic for the current dataset.

## Future Improvements

- Server-side pagination for search and library results
- Advanced recommendation engine with artist and metadata matching
- Playlist support for saved collections
- Redis caching for API responses and session state
- OAuth login for social authentication
- Expanded analytics and exportable reports

# Screenshots

## Login & Authentication

### User Registration - 
Create a new account using email and password.
<img width="1911" height="869" alt="image" src="https://github.com/user-attachments/assets/51fb0bb3-45d9-4307-ac49-cfc8296706f0" />

### User Login -
Authenticate securely using JWT-based authentication.
<img width="1910" height="872" alt="image" src="https://github.com/user-attachments/assets/d15ef180-5f10-4c03-9661-9b5d20cd28c2" />


## Search

### Personalized Recommendations -
Displays album recommendations based on the user's saved library and preferred genres.
<img width="1888" height="868" alt="image" src="https://github.com/user-attachments/assets/37a05ecb-1e55-4368-9966-95d1972638da" />

### Album Search -
Search albums by title or artist using the iTunes Search API.
<img width="1890" height="868" alt="image" src="https://github.com/user-attachments/assets/204bddab-50f2-4b4c-a0ac-29bf704a9df3" />

### Search Pagination -
Browse search results with client-side pagination (6 albums per page).
<img width="1888" height="869" alt="image" src="https://github.com/user-attachments/assets/7e3e5985-31ad-4dbe-9421-0e9a31e37ae9" />

### Success Notification -
Toast notification displayed after successfully saving an album to the library.
<img width="1885" height="869" alt="image" src="https://github.com/user-attachments/assets/413b56bd-c4ac-4695-829d-d45bfca9887a" />


## Library

### My Library -
View all albums saved in your personal music collection.
<img width="1886" height="867" alt="image" src="https://github.com/user-attachments/assets/a8c03f57-a171-496a-a955-2b677deae247" />

### Edit Rating & Notes -
Update personal ratings and notes for any saved album.
<img width="1886" height="868" alt="image" src="https://github.com/user-attachments/assets/e46b6d38-73c3-4183-9ccd-7a5759c3110d" />

### Saved Album - 
Example of an album stored in the user's library with rating and notes.
<img width="1884" height="869" alt="image" src="https://github.com/user-attachments/assets/9c1d6280-ae67-4723-aed9-12300f82e893" />

### Delete Album -
Remove albums from the personal library.
<img width="1884" height="864" alt="image" src="https://github.com/user-attachments/assets/12dc2a85-97fe-49b8-83d5-8240743c97dd" />

### Delete Confirmation -
Success notification displayed after removing an album from the library.
<img width="1887" height="865" alt="image" src="https://github.com/user-attachments/assets/a21f82d5-e37a-4ef6-af26-f061e7197012" />


## Analytics

### Analytics Dashboard -
Overview of genre distributionan and top artists. 
<img width="1889" height="644" alt="image" src="https://github.com/user-attachments/assets/59e563ea-63e3-4d9c-a4bc-5dacecd93396" />

### Analytics Dashboard -
Overview of release years, and track count analysis.
<img width="1887" height="552" alt="image" src="https://github.com/user-attachments/assets/095bd2fb-fb6c-453d-ae70-157b43d3a70f" />


## AI Trend Summary

### AI Trend Summary - 
AI-generated insights based on the user's saved albums, highlighting listening patterns, genres, artists, 
<img width="1741" height="543" alt="image" src="https://github.com/user-attachments/assets/8ea5c64e-7a44-4e91-9d09-d03a012881c8" />


## Profile

### User Profile -
Access account information and profile options.
<img width="406" height="237" alt="image" src="https://github.com/user-attachments/assets/5074d7f0-a3f4-47b1-b6d1-57519db3c680" />

### Logout -
Securely sign out of the application.
<img width="1882" height="867" alt="image" src="https://github.com/user-attachments/assets/aafb2f0e-1682-4d44-954b-fe3d4cb87a18" />

## License
MIT
