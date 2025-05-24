# 📌 Proyecto Visual Scan

Este proyecto tiene como objetivo crear una solución integral para el **registro de asistencia mediante reconocimiento facial**, desarrollado a solicitud de **Colpryst Asesores Ltda**. Está compuesto por un backend en **Node.js (Express)**, un frontend en **React con Vite**, y una API de reconocimiento facial desarrollada en **Python**.

---

## 📁 Estructura del Proyecto

```
/root
│
├── backend_colpryst/       # Backend Node.js (Express)
├── front_colpryst/            # Frontend React + Vite
└── backend_facial_auth/                  # Backend de reconocimiento facial (Python)
```

---

## 🚀 Instalación y Ejecución

### 🔧 Backend (Node.js con Express)

1. Ir al directorio:
   ```bash
   cd bee_express_pruebaback
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Ejecutar el servidor:
   ```bash
   node app.js
   ```

---

### 💻 Frontend (React + Vite)

1. Ir al directorio:
   ```bash
   cd front-vite-prueba
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Ejecutar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

### 🧠 Backend de Reconocimiento Facial (Python)

1. Ir al directorio:
   ```bash
   cd facial_auth
   ```

2. Crear entorno virtual (requiere Python 3.10.x):
   ```bash
   py -3.10 -m venv venv310
   ```

3. Activar entorno virtual (Windows):
   ```bash
   .\venv310\Scripts\Activate.ps1
   ```

4. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

5. Verificar instalación:
   ```bash
   pip list
   ```

6. Para salir del entorno virtual:
   ```bash
   deactivate
   ```

---

## ✅ Requisitos Funcionales

Los módulos clave del sistema incluyen:

| Código  | Funcionalidad                   |
|---------|----------------------------------|
| RF01    | Registro de usuarios            |
| RF02    | Asignación de roles             |
| RF03    | Inicio de sesión                |
| RF04    | Recuperación de contraseña      |
| RF05    | Búsqueda de usuarios            |
| RF06    | Actualización de datos          |
| RF07    | Eliminación de usuarios         |
| RT08    | Reconocimiento facial           |
| RT09    | Registro en tiempo real         |
| RT10    | Registro de novedades           |
| RT11    | Registro de ingreso             |
| RT12    | Registro de salida              |
| RT13    | Notificación por retardos       |
| RT14    | Cierre de sesión                |

Ver detalles en: `requisitos_funcionales.md`

---

## 🧪 Historias de Usuario Destacadas

- **HU1**: Registro de usuario con validaciones.
- **HU3**: Inicio de sesión con credenciales.
- **HU8**: Reconocimiento facial para entrada/salida.
- **HU13**: Notificación automática tras 3 retardos.
- **HU14**: Cierre seguro de sesión.

Consulta el archivo `historias_usuarios.md` para el listado completo.

---

## ⚙️ Requisitos No Funcionales

Alcances técnicos y de calidad que se cumplen:

| Código   | Requisito                                  |
|----------|---------------------------------------------|
| RNF01    | Interfaz fácil de usar                      |
| RNF03    | Diseño coherente                            |
| RNF05    | Responsive design                           |
| RNF10    | Seguridad y privacidad                      |
| RNF12    | Protección de datos personales              |
| RNF13    | Tiempo de carga optimizado                  |
| RNF16    | Soporte para múltiples navegadores          |
| RNF18    | Documentación y mantenibilidad              |

Consulta completa en: `requisitos_no_funcionales.md`

---

## 🧩 Verificación de Conexión a Base de Datos

Para verificar que la base de datos esté conectada correctamente:

1. Revisa la configuración en el archivo `.env` o `config.js`.
2. Asegúrate de que el servicio de base de datos esté activo.
3. Usa herramientas como Postman o Insomnia para probar los endpoints.
4. Verifica en consola que el backend loguee una conexión exitosa.

---

## 🐳 Guía de Uso de Docker para el Proyecto Colpryst

Esta guía explica cómo utilizar Docker y Docker Compose para configurar y ejecutar el entorno de desarrollo del proyecto Colpryst.

### Conceptos Clave

*   **`Dockerfile`**: Define cómo se construye la imagen de una aplicación individual. Contiene los pasos para instalar dependencias, copiar código y demas.
*   **`docker-compose.yml`**: Orquesta múltiples contenedores (servicios) definidos en los Dockerfiles. Define cómo se inician, se conectan en red, qué puertos exponen y qué volúmenes usan.
*   **Imágenes Docker**: Son plantillas de solo lectura que contienen la aplicación y sus dependencias. Se construyen a partir de un `Dockerfile`.
*   **Contenedores Docker**: Son instancias en ejecución de una imagen Docker.
*   **Volúmenes Docker**: Persisten datos generados por los contenedores (como los datos de la base de datos MySQL) o montan el código fuente local dentro del contenedor para desarrollo en vivo.

### Flujo de Trabajo Básico

#### 1. Requisitos Previos (para todos los colaboradores)
*   Tener Docker Desktop (o Docker Engine y Docker Compose CLI en Linux) instalado.
*   Clonar el repositorio del proyecto (que incluye `Dockerfile`, `docker-compose.yml`, y todo el código fuente).

#### 2. Iniciar el Entorno por Primera Vez (o después de cambios en `Dockerfile` o dependencias)
*   Abrir una terminal en la raíz del proyecto (donde está `docker-compose.yml`).
*   Ejecuta:
    ```powershell
    docker-compose up --build -d
    ```
    *   `up`: Crea e inicia los contenedores.
    *   `--build`: Fuerza la reconstrucción de las imágenes si han cambiado los `Dockerfile` o los archivos de contexto de construcción (por ejemplo, si se agrega una nueva dependencia en `package.json` o `requirements.txt`).
    *   `-d`: (Detached mode) Ejecuta los contenedores en segundo plano.

#### 3. Iniciar el Entorno (si las imágenes ya están construidas y no hay cambios en Dockerfiles/dependencias)
```powershell
docker-compose up -d
```

#### 4. Ver Logs de los Contenedores
*   Para ver los logs de todos los servicios:
    ```powershell
    docker-compose logs -f
    ```
*   Para ver los logs de un servicio específico (por ejemplo, `backend-colpryst-app`):
    ```powershell
    docker-compose logs -f backend-colpryst-app
    ```
    (El nombre del servicio puede variar ligeramente, verifica con `docker ps`).

#### 5. Detener el Entorno
```powershell
docker-compose down
```
*   Esto detiene y elimina los contenedores, redes y, opcionalmente, volúmenes (si se especifica). Los datos en volúmenes nombrados (como `proyecto-colpryst_mysql-data`) persistirán a menos que se eliminen manualmente.

### Colaboración y Manejo de Cambios

#### Cambios en el Código Fuente (por ejemplo, archivos `.js`, `.py`, `.html`)
*   Gracias a los volúmenes configurados en `docker-compose.yml`, los cambios en el código local se reflejarán automáticamente dentro de los contenedores.
*   Para Node.js con `nodemon` o servidores de desarrollo de frontend (como Vite), el servidor dentro del contenedor debería reiniciarse o recargar automáticamente.
*   Si no hay recarga automática, reinicia el servicio específico:
    ```powershell
    docker-compose restart nombre-del-servicio-app
    ```

#### Cambios en Dependencias (por ejemplo, `package.json`, `requirements.txt`) o en `Dockerfile`
*   Si se modifica estos archivos, las imágenes Docker deben reconstruirse:
    ```powershell
    docker-compose up --build -d
    ```
    o
    ```powershell
    docker-compose build
    docker-compose up -d
    ```

#### Cambios en la Configuración de `docker-compose.yml`
*   Si se modifica `docker-compose.yml`, simplemente ejecuta:
    ```powershell
    docker-compose up -d
    ```
    Docker Compose aplicará los cambios necesarios.

#### Cambios en el Esquema de la Base de Datos (`sql_colpryst.txt`)
*   El archivo `sql_colpryst.txt` se usa para inicializar la base de datos la primera vez.
*   Si cambia este archivo para modificar el esquema:
    1.  Detén los servicios: `docker-compose down`
    2.  **Importante**: Elimina el volumen de MySQL para forzar la reinicialización (esto borrará todos los datos actuales de la base de datos):
        ```powershell
        docker volume rm proyecto-colpryst_mysql-data
        ```
        (Verifica el nombre del volumen con `docker volume ls`).
    3.  Vuelve a iniciar con reconstrucción:
        ```powershell
        docker-compose up --build -d
        ```

### Compartir el Proyecto

1.  Asegúrar de que todos los archivos necesarios (`Dockerfile`, `docker-compose.yml`, código fuente) estén en el sistema de control de versiones (Git).
2.  Compañeros clonan el repositorio.
3.  Ellos ejecutan `docker-compose up --build -d` en sus máquinas.

### Buenas Prácticas

*   **Control de Versiones (Git):** Fundamental.
*   **Archivo `.dockerignore`:** Se usa para excluir archivos innecesarios del contexto de construcción de la imagen.
*   **Variables de Entorno:** Usar variables de entorno para la configuración sensible o específica del entorno.
*   **Imágenes Pequeñas:** Usar que tus imágenes Docker sean lo más pequeñas posible (usando multi-stage builds, imágenes base ligeras).

---

## 📬 Contacto

Desarrollado para: **Colpryst Asesores Ltda**  
Versión: **3.0**  
Código interno: **PT-ERS-01**

---

## 👥 Roles Principales del Proyecto

### 1️⃣ Product Owner
- **Nombre:** Leydi Johana Arevalo  
  **Responsabilidades:**  
  - Definir la visión y prioridades del producto  
  - Gestionar el product backlog  
  - Validar entregables con stakeholders  

### 2️⃣ Scrum Master  
- **Nombre:** Ivan Dario Jimenez  
  **Responsabilidades:**  
  - Facilitar ceremonias ágiles (dailies, retrospectivas)  
  - Remover obstáculos del equipo  
  - Velar por el cumplimiento de Scrum  

### 3️⃣ Tech Lead  
- **Nombre:** Mauricio Andres Castro Guevara  
  **Responsabilidades:**  
  - Arquitectura de la solución (backend y base de datos)  
  - Revisión de código y estándares técnicos  
  - Mentoría técnica al equipo    

### 4️⃣ UX/UI Team  
- **Nombres:**  
  - Jhon Jairo Moreno Montoya  
  - Diller Adrian Chaguala Marín  
  **Responsabilidades:**  
  - Diseño de interfaces en Figma  
  - Prototipado y validación con usuarios  
  - Implementación frontend (React Vite)  

---


## 👥 Autores

- **Nombre:** Mauricio Andres Castro Guevara 

  **Rol:** Desarrollador Backend (Express), Backend Reconocimiento Facial (Python), Diseñador de Base de Datos

- **Nombre:** Jhon jairo Moreno Montoya 

  **Rol:** Desarrolladora Frontend (React Vite)

- **Nombre:** Diller Adrian Chaguala Marin

  **Rol:** Desarrolladora Frontend (React Vite), Documentación

- **Nombre:** Leydi Johana Arevalo

  **Rol:** Documentación y QA (Pruebas)

  
- **Nombre:** Ivan Dario Jimenez

  **Rol:** Desarrollador Backend (Express), QA (Pruebas)

---

## 📄 Licencia

Este proyecto está licenciado bajo los términos de la **Licencia MIT**.  
Puedes usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y/o vender copias del Software, siempre que incluyas el aviso de derechos de autor original.

---

Copyright (c) 2025 Colpryst Asesores Ltda.

---


