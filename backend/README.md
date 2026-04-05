- `pg` - Driver de PostgreSQL
---
## 📦 Requisitos Previos
Antes de comenzar, asegúrate de tener instalado:
- **Node.js** >= 18.x ([Descargar](https://nodejs.org/))
 # Backend - La Cúpula EJJB
npm --version     # Debe mostrar 9.x o superior
docker --version  # Verificar Docker
 ## 📋 Descripción General
```
 Este directorio contiene el backend del proyecto **La Cúpula EJJB**, desarrollado como parte del Sprint 0. Es una API REST robusta y escalable que gestiona toda la lógica de negocio de la plataforma de administración de clases y sesiones.
backend/
├── prisma/
 ### Funcionalidades principales:
│   │   └── dto/
 - ✅ Health check del sistema
│   │   ├── horarios.> - ✅ CRUD completo de clases
 - ✅ CRUD completo de horarios
 - ✅ Gestión inteligente de sesiones (generación automática)
 - ✅ CRUD completo de anuncios
 - ✅ Validación de datos con DTOs
 - ✅ Integración con base de datos PostgreSQL
 ---
 ## 🛠️ Tecnologías Utilizadas
 | Tecnología | Versión | Propósito |
 |-----------|---------|----------|
 | **NestJS** | ^11.0.1 | Framework backend modular y escalable |
 | **TypeScript** | ^5.7.3 | Lenguaje tipado para mayor seguridad |
 | **Prisma ORM** | ^7.6.0 | ORM para acceso a base de datos |
 | **PostgreSQL** | 16 | Base de datos relacional |
 | **Node.js** | >=18 | Runtime de JavaScript |
 | **Docker** | - | Contenerización de servicios |
 | **Jest** | ^30.0.0 | Framework de testing |
 ### Dependencias principales:
 - `@nestjs/common` - Core de NestJS
 - `@nestjs/config` - Gestión de### Error: "Migration lock" - Las migraciones están bloqueadas
**Solución:**
```bash
npx prisma migrate resolve --rolled-back <nombre-migracion>
npx prisma migrate dev
```
### Puerto 3000 ya está en uso
**Solución:** Cambia el puerto en el archivo `.env`:
```env
PORT=3001  # O el puerto que prefieras
```
### Base de datos no existe
**Solución:**
```bash
npx prisma migrate dev  # Esto crea la BD y ejecuta migraciones
```
---

**Última actualización:** Abril 2026 | **Versión:** 0.0.1
 variables de entorno
 - `@nestjs/platform-express` - Driver HTTP
 - `@prisma/client` - Cliente de Prisma
 - `class-validator` - Validación de DTOs
 - `class-transformer` - Transformación de datos
 - `pg` - Driver de PostgreSQL
 ---
 ## 📦 Requisitos Previos
 Antes de comenzar, asegúrate de tener instalado:
 - **Node.js** >= 18.x ([Descargar](https://nodejs.org/))
 - **npm** >= 9.x (incluido con Node.js)
 - **Docker** y **Docker Compose** ([Instalar](https://docs.docker.com/get-docker/))
 - **Git** (para clonar el repositorio)
 ### Verificar instalación:
 ```bash
 node --version    # Debe mostrar v18.x o superior
 npm --version     # Debe mostrar 9.x o superior
 docker --version  # Verificar Docker
 docker compose --version  # Verificar Docker Compose
 ```
 ---
 ## 🚀 Instalación y Despliegue
 ### Paso 1: Preparar la Base de Datos
 Desde la raíz del proyecto, levanta el contenedor de PostgreSQL:
 ```bash
 cd ..  # Ir a la carpeta raíz (untitled/)
 docker compose up -d
 ```
 Esto:
 - Levanta un contenedor PostgreSQL en el puerto 5433
 - Crea la base de datos `la_cupula_db`
 - Persiste los datos en un volumen llamado `postgres_data`
    **Verificar que PostgreSQL esté corriendo:**
 ```bash
 docker ps  # Debe mostrar el contenedor "la_cupula_postgres"
 ```
 ### Paso 2: Instalar Dependencias
 Desde la carpeta `backend/`:
 ```bash
 cd backend
 npm install
 ```
 ### Paso 3: Configurar Variables de Entorno
 El archivo `.env` ya está configurado con los valores por defecto:
 ```env
 DATABASE_URL="postgresql://postgres:postgres@localhost:5433/la_cupula_db?schema=public"
 PORT=3000
 ```
  **Nota:** Si necesitas cambiar el puerto, usuario o contraseña de PostgreSQL, actualiza el archivo `.env` según corresponda.
 ### Paso 4: Ejecutar Migraciones de Base de Datos
 ```bash
 npx prisma migrate dev
 ```
 Esto:
 - Ejecuta las migraciones pendientes
 - Crea las tablas necesarias en la base de datos
 - Genera el cliente de Prisma actualizado
 ### Paso 5: (Opcional) Semillar la Base de Datos
 Para llenar la base de datos con datos de prueba:
 ```bash
 npx prisma db seed
 ```
 ### Paso 6: Iniciar el Servidor
 **Modo desarrollo (con auto-reload):**
 ```bash
 npm run start:dev
 ```
 **Modo producción:**
 ```bash
 npm run build
 npm run start:prod
 ```
 El servidor estará disponible en: `http://localhost:3000`
 ---
 ## 📂 Estructura del Backend
 ```
 backend/
 ├── prisma/
 │   ├── migrations/          # Migraciones de base de datos
 │   ├── schema.prisma        # Esquema de Prisma (modelos)
 │   └── seed.ts              # Script de datos iniciales
 ├── src/
 │   ├── anuncios/            # Módulo de anuncios
 │   │   ├── anuncios.controller.ts
 │   │   ├── anuncios.module.ts
 │   │   ├── anuncios.service.ts
 │   │   └── dto/
 │   │       ├── create-anuncio.dto.ts
 │   │       └── update-anuncio.dto.ts
 │   ├── clases/              # Módulo de clases
 │   │   ├── clases.controller.ts
 │   │   ├── clases.module.ts
 │   │   ├── clases.service.ts
 │   │   └── dto/
 │   │       ├── create-clase.dto.ts
 │   │       └── update-clase.dto.ts
 │   ├── horarios/            # Módulo de horarios
 │   │   ├── horarios.controller.ts
 │   │   ├── horarios.module.ts
 │   │   ├── horarios.service.ts
 │   │   └── dto/
 │   │       ├── create-horario.dto.ts
 │   │       └── update-horario.dto.ts
 │   ├── sesiones/            # Módulo de sesiones
 │   │   ├── sesiones.controller.ts
 │   │   ├── sesiones.module.ts
 │   │   ├── sesiones.service.ts
 │   │   └── dto/
 │   │       ├── generar-sesiones.dto.ts
 │   │       ├── listar-sesiones.dto.ts
 │   │       └── update-sesion.dto.ts
 │   ├── prisma/              # Servicio de Prisma
 │   │   ├── prisma.module.ts
 │   │   └── prisma.service.ts
 │   ├── app.controller.ts    # Controlador principal
 │   ├── app.module.ts        # Módulo principal
 │   └── main.ts              # Punto de entrada
 ├── test/                    # Tests E2E
 ├── .env                     # Variables de entorno
 ├── nest-cli.json            # Configuración de NestJS CLI
 ├── package.json             # Dependencias del proyecto
 ├── tsconfig.json            # Configuración de TypeScript
 └── README.md                # Este archivo
 ```
 ---
 ## 🔌 Endpoints Disponibles
 ### Health Check
 ```
 GET /health
 ```
 Retorna el estado de la aplicación y la cantidad de clases registradas.
 **Respuesta:**
 ```json
 {
   "ok": true,
   "clases": 5
 }
 ```
 ### Clases
 ```
 GET    /clases              # Listar todas las clases
 POST   /clases              # Crear una nueva clase
 GET    /clases/:id          # Obtener una clase específica
 PATCH  /clases/:id          # Actualizar una clase
 DELETE /clases/:id          # Eliminar una clase
 ```
 ### Horarios
 ```
 GET    /horarios            # Listar todos los horarios
 POST   /horarios            # Crear un nuevo horario
 GET    /horarios/:id        # Obtener un horario específico
 PATCH  /horarios/:id        # Actualizar un horario
 DELETE /horarios/:id        # Eliminar un horario
 ```
 ### Sesiones
 ```
 GET    /sesiones            # Listar sesiones con filtros
 POST   /sesiones/generar    # Generar sesiones automáticamente
 PATCH  /sesiones/:id        # Actualizar una sesión
 ```
 ### Anuncios
 ```
 GET    /anuncios            # Listar todos los anuncios
 POST   /anuncios            # Crear un nuevo anuncio
 GET    /anuncios/:id        # Obtener un anuncio específico
 PATCH  /anuncios/:id        # Actualizar un anuncio
 DELETE /anuncios/:id        # Eliminar un anuncio
 ```
 ---
 ## 📜 Scripts Disponibles
 | Script | Comando | Descripción |
 |--------|---------|-------------|
 | Iniciar (desarrollo) | `npm run start:dev` | Inicia el servidor en modo desarrollo con auto-reload |
 | Iniciar (debug) | `npm run start:debug` | Inicia en modo debug con hot-reload |
 | Iniciar (producción) | `npm run start:prod` | Inicia la versión compilada de producción |
 | Compilar | `npm run build` | Compila el código TypeScript a JavaScript |
 | Linter | `npm run lint` | Valida el código con ESLint y auto-corrige errores |
 | Formatear | `npm run format` | Formatea el código con Prettier |
 | Tests | `npm run test` | Ejecuta los tests unitarios una sola vez |
 | Tests (watch) | `npm run test:watch` | Ejecuta tests en modo observador |
 | Coverage | `npm run test:cov` | Genera reporte de cobertura de tests |
 | Tests E2E | `npm run test:e2e` | Ejecuta los tests end-to-end |
 ---
 ## 🗄️ Modelo de Datos
 ### Clase
 ```typescript
 {
   id: number;              // ID único (autoincremental)
   nombre: string;          // Nombre de la clase (único)
   descripcion?: string;    // Descripción de la clase
   nivel?: string;          // Nivel de la clase
   activa: boolean;         // Si la clase está activa
   createdAt: DateTime;     // Fecha de creación
   horarios: Horario[];     // Horarios asociados
 }
 ```
 ### Horario
 ```typescript
{
   id: number;              // ID único
   claseId: number;         // ID de la clase
   diaSemana: number;       // Día de la semana (0-6)
   horaInicio: string;      // Hora inicio (HH:mm)
   horaFin: string;         // Hora fin (HH:mm)
   instructor?: string;     // Instructor
   aula?: string;           // Aula
   activo: boolean;         // Si está activo
   createdAt: DateTime;     // Fecha de creación
   sesiones: Sesion[];      // Sesiones generadas
 }
 ```
 ### Sesión
 ```typescript
 {
   id: number;              // ID único
   horarioId: number;       // ID del horario
   fecha: DateTime;         // Fecha de la sesión
   horaInicio: string;      // Hora inicio
   horaFin: string;         // Hora fin
   instructor?: string;     // Instructor
   aula?: string;           // Aula
   observaciones?: string;  // Observaciones
   estado: SesionEstado;    // Estado (PROGRAMADA, MODIFICADA, CANCELADA)
   createdAt: DateTime;     // Fecha de creación
 }
 ```
 ### Anuncio
 ```typescript
 {
   id: number;              // ID único
   titulo: string;          // Título del anuncio
   contenido: string;       // Contenido
   activo: boolean;         // Si está activo
   publicadoEn: DateTime;   // Fecha de publicación
 }
 ```
 ---
 ## 🧪 Pruebas
 ### Ejecutar tests unitarios:
 ```bash
 npm run test
 ```
 ### Ejecutar tests en modo observador:
 ```bash
 npm run test:watch
 ```
 ### Generar reporte de cobertura:
 ```bash
 npm run test:cov
 ```
 ### Ejecutar tests E2E:
 ```bash
 npm run test:e2e
 ```
 ---
 ## 🔧 Solución de Problemas
 ### Error: "ECONNREFUSED" - No puede conectar a PostgreSQL
 **Solución:**
 ```bash
 docker compose up -d  # Asegúrate de que el contenedor esté corriendo
 docker ps             # Verifica que "la_cupula_postgres" está activo
 ```
 ### Error: "Migration lock" - Las migraciones están bloqueadas
 **Solución:**
 ```bash
 npx prisma migrate resolve --rolled-back <nombre-migracion>
 npx prisma migrate dev
 ```
 ### Puerto 3000 ya está en uso
 **Solución:** Cambia el puerto en el archivo `.env`:
 ```env
 PORT=3001  # O el puerto que prefieras
 ```
 ### Base de datos no existe
 **Solución:**
 ```bash
 npx prisma migrate dev  # Esto crea la BD y ejecuta migraciones
 ```
 ---
 ## 📚 Recursos Útiles
 - [Documentación de NestJS](https://docs.nestjs.com/)
 - [Documentación de Prisma](https://www.prisma.io/docs/)
 - [Documentación de PostgreSQL](https://www.postgresql.org/docs/)
 - [TypeScript Handbook](https://www.typescriptlang.org/docs/)
# Backend - La CM-CM-:pula EJJB$
## M-pM-^_M-^SM-^K DescripciM-CM-3n General$
Este directorio contiene el backend del proyecto **La CM-CM-:pula EJJB**, desarrollado como parte del Sprint 0. Es una API REST robusta y escalable que gestiona toda la lM-CM-3gica de negocio de la plataforma de administraciM-CM-3n de clases y sesiones.$
### Funcionalidades principales:$
- M-bM-^\M-^E Health check del sistema$
  darlo@DarloUSSEnterprise:~/WebstormProjects/untitled$ wc -l /home/darlo/WebstormProjects/untitled/backend/README.md && echo "---" && head -20 /home/darlo/WebstormProjects/untitled/backend/README.md
  313 /home/darlo/WebstormProjects/untitled/backend/README.md
---
# Backend - La Cúpula EJJB
## 📋 Descripción General
Este directorio contiene el backend del proyecto **La Cúpula EJJB**, desarrollado como parte del Sprint 0. Es una API REST robusta y escalable que gestiona toda la lógica de negocio de la plataforma de administración de clases y sesiones.
### Funcionalidades principales:
- ✅ Health check del sistema
- ✅ CRUD completo de clases
- ✅ CRUD completo de horarios
- ✅ Gestión inteligente de sesiones (generación automática)
- ✅ CRUD completo de anuncios
- ✅ Validación de datos con DTOs
- ✅ Integración con base de datos PostgreSQL
---
## 🛠️ Tecnologías Utilizadas
| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| **NestJS** | ^11.0.1 | Framework backend modular y escalable |
| **TypeScript** | ^5.7.3 | Lenguaje tipado para mayor seguridad |
| **Prisma ORM** | ^7.6.0 | ORM para acceso a base de datos |
| **PostgreSQL** | 16 | Base de datos relacional |
| **Node.js** | >=18 | Runtime de JavaScript |
docker compose up -d  # Asegúrate de que el contenedor esté corriendo
docker ps             # Verifica que "la_cupula_postgres" está activo
```