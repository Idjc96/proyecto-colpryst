# Dockerfile para el proyecto Colpryst

# Etapa de construcción para el backend Node.js (colpryst)
FROM node:18-alpine AS backend-colpryst-builder
WORKDIR /app/backend_colpryst
COPY backend_colpryst/package.json backend_colpryst/package-lock.json* ./
RUN npm install
COPY backend_colpryst/ .

# Etapa de construcción para el backend Python (facial_auth)
FROM python:3.10-slim AS backend-facial-auth-builder
WORKDIR /app/backend_facial_auth
# Ya no se instala libgl1-mesa-glx aquí, se hará en la etapa final
COPY backend_facial_auth/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend_facial_auth/ .

# Etapa de construcción para el frontend React (colpryst)
FROM node:18-alpine AS frontend-builder
WORKDIR /app/front_colpryst
COPY front_colpryst/package.json front_colpryst/package-lock.json* ./
RUN npm install
COPY front_colpryst/ .
RUN npm run build

# Etapa final: Usar una imagen base ligera para Node.js para el backend de Colpryst
FROM node:18-alpine AS backend-colpryst
WORKDIR /app/backend_colpryst
COPY --from=backend-colpryst-builder /app/backend_colpryst .
# Copiar el frontend construido al directorio public del backend de Colpryst
COPY --from=frontend-builder /app/front_colpryst/dist ./public 
EXPOSE 3000
CMD ["node", "app.js"]

# Etapa final: Usar una imagen base ligera para Python para el backend de autenticación facial
FROM python:3.10-slim AS backend-facial-auth
WORKDIR /app/backend_facial_auth
COPY --from=backend-facial-auth-builder /app/backend_facial_auth /app/backend_facial_auth
COPY --from=backend-facial-auth-builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=backend-facial-auth-builder /usr/local/bin /usr/local/bin
ENV PYTHONPATH=/app/backend_facial_auth
RUN apt-get update && \
    apt-get install -y libgl1-mesa-glx libglib2.0-0 tk tk-dev tcl-dev && \
    rm -rf /var/lib/apt/lists/*
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Esta es una configuración básica. 
# Para producción, considera usar un servidor web como Nginx o Apache 
# para servir el frontend y actuar como proxy inverso para los backends.
# También necesitarás una forma de ejecutar ambos servicios (backend-colpryst y backend-facial-auth)
# simultáneamente, por ejemplo, usando Docker Compose.
