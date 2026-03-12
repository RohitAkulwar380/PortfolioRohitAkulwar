# Backend Architecture Documentation

This document provides a comprehensive overview of the portfolio backend's architecture, including file responsibilities, data flow, API behavior, database interactions, and execution dry runs.

## 📁 Directory & File Structure

The backend follows a modular, single-responsibility architecture, strongly adhering to SOLID principles.

- **`main.py`**: The FastAPI application entry point. Handles app initialization, CORS configuration, route registration (`/api`), and database table creation on startup. Contains *no* business logic.
- **`config/settings.py`**: Centralized configuration management. Loads environment variables from `.env` (like `OPENROUTER_API_KEY`, `DATABASE_URL`) ensuring other modules don't call `load_dotenv` directly.
- **`models/database.py`**: Database engine setup and table definitions using SQLAlchemy Core. Defines the `chat_logs` table schema and the `create_tables` startup function.
- **`routes/`**: Contains HTTP route handlers. These files only handle request validation and dependency injection; they delegate logic to services.
  - **`chat.py`**: Handles `POST /api/chat`. Validates incoming chat schemas, calls `ResumeService` for context, uses `OpenRouterService` for the LLM reply, and logs the exchange to the database.
  - **`resume.py`**: Handes `GET /api/resume` (serves the structured JSON resume) and `GET /api/health` (Cloudflare/uptime health check).
- **`services/`**: Contains core business logic and external integrations.
  - **`openrouter.py`**: Wraps the OpenRouter API. Builds the LLM system prompt using the candidate's resume, defines the strict conversational rules, and makes the async HTTP request via `httpx`.
  - **`resume.py`**: Reads and parses `data/resume.json` at startup. Provides methods to retrieve the full JSON object or format it as plain-text for the LLM context.
### Architecture Pattern: Route-Service Separation
The project uses the **Controller-Service Pattern**. Routes only handle HTTP communication, delegating all business logic to Services.
    
```mermaid
flowchart LR
    subgraph Frontend [React Frontend]
        UI([Visitor Browser])
    end

    subgraph Backend [FastAPI Backend]
        direction TB
        subgraph Routes [Routes / Controllers]
            ChatRoute[routes/chat.py]
            ResumeRoute[routes/resume.py]
        end
        
        subgraph Services [Business Logic]
            OpenRouterSvc[services/openrouter.py]
            ResumeSvc[services/resume.py]
        end
    end
    
    subgraph External [Data Layer]
        OR_API{{OpenRouter API}}
        JSON_DB[(data/resume.json)]
        SQL_DB[(Supabase Postgres)]
    end

    %% Flow logic
    UI -- "POST /api/chat" --> ChatRoute
    UI -- "GET /api/resume" --> ResumeRoute
    
    ChatRoute -- Injects & Calls --> ResumeSvc
    ChatRoute -- Injects & Calls --> OpenRouterSvc
    ResumeRoute -- Injects & Calls --> ResumeSvc
    
    OpenRouterSvc -- httpx --> OR_API
    ResumeSvc -- Reads at startup --> JSON_DB
    ChatRoute -- Appends log --> SQL_DB
    
    classDef route fill:#2E7D32,stroke:#1B5E20,color:white;
    classDef service fill:#1565C0,stroke:#0D47A1,color:white;
    classDef data fill:#D84315,stroke:#BF360C,color:white;
    
    class ChatRoute,ResumeRoute route;
    class OpenRouterSvc,ResumeSvc service;
    class OR_API,JSON_DB,SQL_DB data;
```

---

## 🗄️ Database Design

The system uses **SQLAlchemy Core** (instead of the heavier SQLAlchemy ORM) to keep the app highly performant. `models/database.py` manages the connection pool and stores table schemas.

### Database Engine & Connection (`models/database.py`)
The `engine` object in this file is the beating heart of your data layer. 
- It dynamically adapts to either a local SQLite file (no SSL) or a remote Supabase Postgres DB (forces `sslmode=require`).
- Uses `pool_pre_ping=True` to gracefully handle dropped connections without crashing the app.
- Contains an asynchronous `create_tables()` function called ONLY at startup by `main.py`.

### Schema: `chat_logs`
An append-only table to store question-and-answer pairs for analytics and debugging.

```mermaid
erDiagram
    chat_logs {
        Integer id PK "Auto-incrementing primary key"
        String session_id "UUID to group browser sessions (Indexed)"
        Text user_message "The raw question asked by the visitor"
        Text ai_response "The LLM's generated reply"
        DateTime created_at "Auto-generated DB timestamp"
    }
```

*Note: Database logging is implemented as "best-effort" in `chat.py`. If the DB insert fails during a chat, it surfaces a 500 error to the route but doesn't crash the server.*

### `services/openrouter.py` Flowchart
This service is the isolated wrapper for all LLM network communication.

```mermaid
flowchart TD
    Start(Route calls .chat) --> CheckArgs{Args Valid?}
    
    CheckArgs -->|Yes| BuildSys[1. _build_system_prompt<br>Inject Name & Resume JSON]
    CheckArgs -->|No| Err1[Raise Error]
    
    BuildSys --> BuildHead[2. _build_headers<br>Attach API Key & Content-Type]
    BuildHead --> BuildPay[3. _build_payload<br>Format OpenAI messages array]
    
    BuildPay --> HTTPX[4. httpx.AsyncClient.post<br>Timeout: 30s]
    
    HTTPX --> HTTPCheck{Response 200 OK?}
    
    HTTPCheck -->|No| Err2[raise_for_status<br>FastAPI returns 502]
    HTTPCheck -->|Yes| Parse[5. response.json]
    
    Parse --> ExtractCheck{Has choices 0 .message?}
    ExtractCheck -->|No| Err3[Raise ValueError<br>Bad Response Shape]
    ExtractCheck -->|Yes| Extract[6. Extract & strip text]
    
    Extract --> Return(Return AI String to Route)
```

---

## 🔄 API Calls & Data Flow

### 1. `GET /api/resume`
Fetches the candidate's data to dynamically render the frontend UI.

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant Route as routes/resume.py
    participant Service as services/resume.py
    participant File as data/resume.json

    Client->>Route: GET /api/resume
    Route->>Service: get_all()
    Note over Service: Returns in-memory dictionary<br>(loaded at startup)
    Service-->>Route: JSON Dictionary
    Route-->>Client: 200 OK (Resume Data)
```

### 2. `POST /api/chat`
Handles user questions by combining the message with resume data and querying the LLM.

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant Route as routes/chat.py
    participant ResSvc as services/resume.py
    participant LLMSvc as services/openrouter.py
    participant OpenRouter as OpenRouter API
    participant DB as SQLite / PostgreSQL

    Client->>Route: POST /api/chat {message, session_id}
    Route->>ResSvc: get_all()
    ResSvc-->>Route: resume_data (JSON)
    Route->>LLMSvc: chat(message, parsed JSON text, name)
    
    Note over LLMSvc: Formats system prompt<br>with strict rules + resume context
    LLMSvc->>OpenRouter: Async POST /v1/chat/completions
    OpenRouter-->>LLMSvc: LLM Response String
    LLMSvc-->>Route: AI Reply String
    
    Note over Route: Best-effort logging
    Route->>DB: INSERT INTO chat_logs {session_id, message, reply}
    DB-->>Route: Success
    Route-->>Client: 200 OK {reply, session_id}
```

---

### FastAPI Execution Lifecycle (`routes/chat.py`)
This diagram illustrates the exact chronological execution flow of how FastAPI handles validation and Dependency Injection *before* the business logic runs.

```mermaid
flowchart TD
    subgraph Phase1 [Phase 1: Validation]
        Req([POST /api/chat<br>JSON Payload]) --> Pydantic{ChatRequest<br>Schema Validation}
        Pydantic -->|Fails| Err[422 Error<br>Unprocessable Entity]
        Pydantic -->|Passes| Body[body: ChatRequest<br>Validated Object]
    end

    subgraph Phase2 [Phase 2: Dependency Injection]
        Body --> DI1[Depends: get_resume_service]
        Body --> DI2[Depends: get_openrouter_service]
        
        DI1 --> ResObj[resume_svc: ResumeService]
        DI2 --> LLMObj[llm_svc: OpenRouterService]
    end

    subgraph Phase3 [Phase 3: Route Execution]
        Body & ResObj & LLMObj --> Inject((Inject down into<br>route function))
        
        Inject --> Func[def chat<br>body, resume_svc, llm_svc]
        
        Func --> Step1[1. resume_svc.get_all]
        Step1 --> Step2[2. llm_svc.chat]
        Step2 --> Step3[3. insert chat_logs]
        Step3 --> Return([Return ChatResponse])
    end
    
    style Err fill:#c62828,stroke:#b71c1c,color:#fff
```

## 🏃 Execution Dry Runs (Step-by-Step)

### Scenario A: Application Startup
1. `uvicorn main:app` is executed.
2. `config/settings.py` resolves paths and loads `.env` variables (`DATABASE_URL`, `OPENROUTER_API_KEY`).
3. `services/resume.py` initializes, securely loading `data/resume.json` into memory.
4. FastAPI initializes the app instance.
5. The `@asynccontextmanager` lifespan triggers `create_tables()`.
6. `models/database.py` connects to the DB and creates the `chat_logs` table if it doesn't exist.
7. Routes are registered under `/api`, CORS is applied, and the server begins listening.

### Scenario B: A user asks, "What are Rohit's skills?"

```mermaid
sequenceDiagram
    autonumber
    
    box Frontend
    participant Browser as Frontend UI
    end
    
    box backend/routes
    participant ChatRoute as chat.py
    end
    
    box backend/services
    participant ResumeSvc as resume.py
    participant OpenRouterSvc as openrouter.py
    end
    
    box External & Data
    participant OR_API as OpenRouter API
    participant DB as models/database.py
    end

    Browser->>ChatRoute: POST /api/chat<br/>(ChatRequest payload)
    
    Note over ChatRoute: Validate payload via Pydantic
    
    ChatRoute->>ResumeSvc: ResumeService.get_all()
    ResumeSvc-->>ChatRoute: return dictionary (from resume.json)
    Note over ChatRoute: Serialize dict to JSON string
    
    ChatRoute->>OpenRouterSvc: await OpenRouterService.chat(message, resume_text, name)
    Note over OpenRouterSvc: _build_system_prompt()<br/>_build_payload()
    OpenRouterSvc->>OR_API: httpx.AsyncClient().post(/chat/completions)
    OR_API-->>OpenRouterSvc: JSON Response
    Note over OpenRouterSvc: Extract choices[0].message.content
    OpenRouterSvc-->>ChatRoute: return AI reply string
    
    ChatRoute->>DB: engine.connect().execute(insert(chat_logs))
    DB-->>ChatRoute: Commit success
    
    ChatRoute-->>Browser: HTTP 200 OK<br/>(ChatResponse payload)
```

1. **Request:** Frontend generates UUID `123e4567` and sends `POST /api/chat` with `{"message": "What are Rohit's skills?", "session_id": "123e4567"}`.
2. **Validation:** `ChatRequest` Pydantic model validates the payload.
3. **Data Retrieval:** The route calls `ResumeService.get_all()`, fetching the cached resume dictionary. It extracts the name "Rohit" and serializes the full data back to a JSON string.
4. **LLM Prompting:** The route calls `OpenRouterService.chat()`.
   - The service injects the JSON string into `_SYSTEM_PROMPT_TEMPLATE`.
   - The template enforces strict response behavior rules.
5. **Network Call:** An async `httpx` POST is made to OpenRouter's `chat/completions` endpoint using the configured model.
6. **Response Processing:** OpenRouter returns the AI response within 2-5 seconds. `OpenRouterService` extracts the raw string.
7. **Database Logging:** The route opens a synchronous SQLAlchemy connection and performs an `INSERT` into `chat_logs` with the session ID, query, and reply. The connection is committed.
8. **HTTP Return:** FastAPI wraps the LLM string and session ID in a `ChatResponse` schema and returns it as a `200 OK` JSON response to the browser.
