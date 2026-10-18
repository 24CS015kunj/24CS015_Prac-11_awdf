# Practical 11: Containerization with Docker and Docker Compose

**Course:** Advanced Web Development Frameworks (ITUE301)  
**Institution:** Charotar University of Science and Technology (CHARUSAT)  
**Faculty:** Faculty of Technology and Engineering (DEPSTAR / CSPIT)  
**Department:** B.Tech (IT / CE / CSE / AIML)  
**CO/PO Mapping:** CO5 / PO3, PO5  

---

## 🎯 Objective
To containerize a full-stack Task Management application (React frontend, Node/Express backend, and MongoDB database) using Docker and orchestrate all multi-container services seamlessly using Docker Compose.

---

## 🏗️ Architecture & Service Topology

```
                  ┌───────────────────────────────────────────┐
                  │            docker-compose.yml             │
                  │          Network: app-network             │
                  └───────────────────────────────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │                            │                            │
           ▼                            ▼                            ▼
   ┌───────────────┐            ┌───────────────┐            ┌───────────────┐
   │   frontend    │            │    backend    │            │    mongodb    │
   │  (React/Vite) │ ──(HTTP)─► │ (Node/Express)│ ──(Mongoose)► (Official)   │
   │   Port 5173   │            │   Port 5000   │            │  Port 27017   │
   └───────────────┘            └───────────────┘            └───────────────┘
           │                            │                            │
     Host: 5173                   Host: 5000                   Named Volume
                                                              (mongo-data)
```

### Services Overview
| Service | Image / Build Context | Container Port | Host Port | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`mongodb`** | `mongo:latest` | `27017` | `27017` | Official MongoDB document database with persistent named volume (`mongo-data`). |
| **`backend`** | `./backend/Dockerfile` (`node:18`) | `5000` | `5000` | Express REST API connected to MongoDB via `mongodb://mongodb:27017/taskdb`. |
| **`frontend`** | `./frontend/Dockerfile` (`node:18`) | `5173` | `5173` | React (Vite) single-page client built & served via `preview --host 0.0.0.0 --port 5173`. |

---

## 📁 Project Structure

```
Practical-11/
├── .dockerignore              # Root-level ignore rules for Docker context
├── docker-compose.yml         # Multi-container orchestration definition
├── README.md                  # Comprehensive documentation and viva analysis
├── backend/
│   ├── .dockerignore          # Excludes node_modules, .env, and local git
│   ├── Dockerfile             # Backend container image recipe (node:18)
│   ├── package.json           # Express, Mongoose, CORS, Dotenv
│   ├── server.js              # REST API & MongoDB connection logic
│   └── models/
│       └── Task.js            # Mongoose Schema for tasks
└── frontend/
    ├── .dockerignore          # Excludes node_modules, dist, .env
    ├── Dockerfile             # Multi-stage frontend container image recipe
    ├── index.html             # HTML entry point
    ├── package.json           # React 18, Vite dependencies & scripts
    ├── vite.config.js         # Configured for host 0.0.0.0 binding
    └── src/
        ├── api.js             # API helper for Backend REST communication
        ├── App.jsx            # Interactive Task Management UI component
        ├── index.css          # Modern glassmorphism UI styles
        └── main.jsx           # React DOM root render
```

---

## 🚀 Getting Started & Execution

### Prerequisites
1. **Docker Desktop** (or Docker Engine) installed and running.
2. Verify Docker and Docker Compose installation:
   ```bash
   docker --version
   docker compose version
   ```

### 1-Step Execution (Single Command)
Run the entire stack with automatic build and container creation:
```bash
docker-compose up --build
```
*To run in detached (background) mode:*
```bash
docker-compose up -d --build
```

### Accessing the Applications
- **Frontend Web UI:** [http://localhost:5173](http://localhost:5173)
- **Backend API Root / Healthcheck:** [http://localhost:5000](http://localhost:5000)
- **Backend Tasks Endpoint:** [http://localhost:5000/tasks](http://localhost:5000/tasks)
- **MongoDB Database:** `mongodb://localhost:27017/taskdb`

### Verifying Running Containers
```bash
docker ps
```
You should see all 3 containers active:
- `task_frontend` (Status: Up, Ports: `0.0.0.0:5173->5173/tcp`)
- `task_backend` (Status: Up, Ports: `0.0.0.0:5000->5000/tcp`)
- `task_mongodb` (Status: Up, Ports: `0.0.0.0:27017->27017/tcp`)

### Stopping the Stack
```bash
docker-compose down
```
*To also remove persistent volumes:*
```bash
docker-compose down -v
```

---

## 🧪 Supplementary Features Implemented

1. **`.dockerignore` Optimization:**
   - Both root and subfolder build contexts explicitly exclude `node_modules`, `.env`, `dist`, and `.git` to prevent build context bloat and speed up image building.
2. **Multi-Stage Build Pattern:**
   - The React frontend utilizes a multi-stage build structure (`FROM node:18 AS build`) compiling dependencies and serving via Vite preview.
3. **Named Volume Persistence for MongoDB:**
   - Configured `mongo-data:/data/db` under the `mongodb` service so task data persists intact across container restarts and updates.
4. **Isolated Bridge Network (`app-network`):**
   - Inter-container communication is established across a dedicated user-defined bridge network with automatic internal DNS resolution.

---

## 🧠 Key Questions & Viva Analysis

### Q1: Why does the backend container need to reference the MongoDB container by its service name (`mongodb`) rather than `localhost`?
> **Answer:**  
> In Docker, each container operates in its own network namespace with an isolated loopback interface (`localhost` / `127.0.0.1`). If the backend container attempts to connect to `localhost:27017`, it looks for a MongoDB process running inside the backend container itself, which does not exist and fails.  
> When containers share a user-defined bridge network (e.g., `app-network`), Docker provides an automatic built-in DNS service discovery mechanism. Resolving the hostname `mongodb` (the service name defined in `docker-compose.yml`) routes directly to the IP address allocated to the MongoDB container on that network.

### Q2: What is the difference between `EXPOSE` in a Dockerfile and the `ports` mapping in `docker-compose.yml`?
> **Answer:**  
> - **`EXPOSE` (Dockerfile):** Functions as internal documentation and metadata indicating which port the application listens on inside the container. It does **not** publish or expose the port to the host machine or host network.  
> - **`ports` (docker-compose.yml):** Defines an active network binding in `HOST:CONTAINER` format (e.g., `'5000:5000'`). It forwards inbound traffic from the host machine's port directly into the container's exposed port, making the service accessible to host browsers, Postman, or external clients.

### Q3: Why is it considered bad practice to copy `node_modules` into a Docker image instead of running `npm install` inside the container?
> **Answer:**  
> 1. **Native Binary Incompatibility:** Certain npm packages contain compiled C/C++ bindings (e.g., `bcrypt`, `sharp`). If copied from a host OS (like Windows x64 or macOS ARM), the compiled binaries will fail to execute inside a Linux container (`Linux ELF`).  
> 2. **Build Context Bloat & Slow Transfers:** A `node_modules` directory typically contains tens of thousands of files totaling hundreds of megabytes. Sending this massive context to the Docker daemon severely slows down image builds.  
> 3. **Layer Caching Invalidation:** Running `COPY package*.json ./` followed by `RUN npm install` enables Docker layer caching. The dependencies layer is cached and only rebuilt when `package.json` changes, keeping subsequent builds fast.

---

## 🛠️ Troubleshooting Guide

| Symptom | Likely Cause | Solution / Fix |
| :--- | :--- | :--- |
| **Backend cannot connect to MongoDB** | Connection string mistakenly uses `localhost` instead of the Compose service name | Set `MONGO_URI=mongodb://mongodb:27017/taskdb` in `docker-compose.yml` / `server.js`. |
| **Port already in use error** | A previous local service or dangling container is holding port 5000, 5173, or 27017 | Run `docker ps` to find and stop conflicting containers, or kill the host process holding the port. |
| **Docker build is extremely slow** | Local `node_modules` or `.git` are being copied into Docker build context | Ensure `.dockerignore` exists and contains `node_modules` and `.env`. |
| **Changes to code not reflected** | Docker is utilizing cached image layers from previous builds | Run `docker-compose up --build` to force fresh image layer compilation. |

---

## 📝 Learning Outcome
Successfully mastered containerizing full-stack web applications using Docker, writing modular Dockerfiles for both frontend and backend environments, managing persistent data with Docker volumes, configuring bridge network service discovery, and orchestrating the entire multi-tier stack with a single `docker-compose up` command.
