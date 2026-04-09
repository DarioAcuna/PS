## 📋 Descripción General

Este directorio contiene el frontend del proyecto **La Cúpula EJJB**, desarrollado como parte del Sprint 0. Es una aplicación web moderna y escalable construida con Angular que proporciona la interfaz de usuario para la administración de clases, horarios, sesiones y anuncios.

### Funcionalidades principales:

- ✅ Visualización y gestión de clases
- ✅ Gestión de horarios
- ✅ Visualización de sesiones
- ✅ Gestión de anuncios
- ✅ Arquitectura modular con Angular
- ✅ Comunicación con la API REST del backend

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| **Angular** | ^18.x | Framework frontend modular y escalable |
| **TypeScript** | ^5.x | Lenguaje tipado para mayor seguridad |
| **RxJS** | ^7.x | Programación reactiva y gestión de estados asíncronos |
| **Angular Router** | ^18.x | Navegación entre módulos y páginas |
| **SCSS** | - | Preprocesador CSS para estilos avanzados |
| **Node.js** | >=18 | Runtime necesario para el tooling |

### Dependencias principales:

- `@angular/core` - Core del framework Angular
- `@angular/common` - Utilidades comunes de Angular
- `@angular/router` - Módulo de enrutamiento
- `@angular/forms` - Formularios reactivos y basados en plantillas
- `@angular/http` (HttpClient) - Comunicación HTTP con el backend
- `rxjs` - Manejo de flujos reactivos

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.x ([Descargar](https://nodejs.org/))
- **npm** >= 9.x (incluido con Node.js)
- **Angular CLI** >= 18.x
- **Git** (para clonar el repositorio)

### Verificar instalación:

```bash
node --version     # Debe mostrar v18.x o superior
npm --version      # Debe mostrar 9.x o superior
ng version         # Debe mostrar Angular CLI 18.x o superior
```

### Instalar Angular CLI (si no está instalado):

```bash
npm install -g @angular/cli
```

---

## 🚀 Instalación y Despliegue

### Paso 1: Instalar Dependencias

Desde la carpeta `frontend/`:

```bash
cd frontend
npm install
```

### Paso 2: Configurar Variables de Entorno

Los entornos están en `src/environments/`. Por defecto:

```typescript
// src/environments/environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

```typescript
// src/environments/environment.prod.ts (producción)
export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio.com/api'
};
```

**Nota:** Asegúrate de que el backend esté corriendo en `http://localhost:3000` antes de iniciar el frontend.

### Paso 3: Iniciar el Servidor de Desarrollo

```bash
ng serve
```

O con npm:

```bash
npm start
```

La aplicación estará disponible en: `http://localhost:4200`

### Modo Producción:

```bash
ng build --configuration production
```

Los archivos compilados se generarán en la carpeta `dist/`.

---

## 📂 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                  # 🧠 Lógica global y única de la app
│   │   │   ├── guards/            # Guards de rutas (auth, roles)
│   │   │   ├── interceptors/      # Interceptores HTTP (auth, errores)
│   │   │   ├── services/          # Servicios globales (auth, config)
│   │   │   └── models/            # Interfaces y modelos globales
│   │   │
│   │   ├── shared/                # 🧩 Componentes y utilidades reutilizables
│   │   │   ├── components/        # Componentes compartidos (botones, modales)
│   │   │   ├── directives/        # Directivas reutilizables
│   │   │   ├── pipes/             # Pipes personalizados
│   │   │   └── shared.module.ts   # Módulo compartido
│   │   │
│   │   ├── features/              # 🚀 Módulos de negocio (lo más importante)
│   │   │   ├── anuncios/          # Módulo de anuncios
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   └── anuncios.module.ts
│   │   │   ├── clases/            # Módulo de clases
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   └── clases.module.ts
│   │   │   ├── horarios/          # Módulo de horarios
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   └── horarios.module.ts
│   │   │   └── sesiones/          # Módulo de sesiones
│   │   │       ├── components/
│   │   │       ├── services/
│   │   │       └── sesiones.module.ts
│   │   │
│   │   ├── layout/                # 🎨 Estructura visual de la app
│   │   │   ├── navbar/
│   │   │   ├── sidebar/
│   │   │   └── footer/
│   │   │
│   │   ├── app-routing.module.ts  # Configuración de rutas principales
│   │   └── app.module.ts          # Módulo raíz de la aplicación
│   │
│   ├── assets/                    # Recursos estáticos (imágenes, iconos, fuentes)
│   ├── environments/              # Variables de entorno por perfil
│   └── styles.scss                # Estilos globales
│
├── angular.json                   # Configuración del proyecto Angular
├── package.json                   # Dependencias del proyecto
├── tsconfig.json                  # Configuración de TypeScript
└── README.md                      # Este archivo
```

---

## 🧠 Arquitectura por Capas

### `app/core` — Global y único

Aquí reside todo lo que es **singleton** en la aplicación: lógica que se instancia una sola vez y está disponible en toda la app. No debe importarse en módulos de features, solo en `AppModule`.

- Guards de navegación
- Interceptores HTTP (tokens, manejo de errores)
- Servicios de autenticación y configuración global
- Modelos e interfaces de dominio

### `app/shared` — Reutilizable

Componentes, directivas y pipes que se usan en **más de un módulo**. Se exportan a través de `SharedModule`, que se importa donde sea necesario.

- Componentes UI genéricos (botones, tarjetas, spinners)
- Pipes de formato (fechas, textos)
- Directivas de comportamiento

### `app/features` — La aplicación real

Cada carpeta es un **módulo lazy-loaded** independiente que encapsula toda la lógica de una funcionalidad específica (componentes, servicios, rutas).

| Feature | Descripción |
|---------|-------------|
| `anuncios` | Listado, creación, edición y eliminación de anuncios |
| `clases` | Gestión completa del catálogo de clases |
| `horarios` | Administración de horarios por clase |
| `sesiones` | Visualización y modificación de sesiones generadas |

### `app/layout` — Estructura visual

Componentes que definen el **esqueleto visual** de la aplicación: barra de navegación, sidebar, footer. Se cargan una sola vez como envoltura de las vistas.

---

## 🔌 Comunicación con el Backend

El frontend consume la API REST del backend en `http://localhost:3000`. Los servicios de cada feature se encargan de realizar las peticiones HTTP correspondientes:

| Feature | Endpoints consumidos |
|---------|---------------------|
| Clases | `GET/POST/PATCH/DELETE /clases` |
| Horarios | `GET/POST/PATCH/DELETE /horarios` |
| Sesiones | `GET /sesiones`, `POST /sesiones/generar`, `PATCH /sesiones/:id` |
| Anuncios | `GET/POST/PATCH/DELETE /anuncios` |

---

## 📜 Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| Iniciar (desarrollo) | `npm start` / `ng serve` | Inicia el servidor en modo desarrollo con live-reload |
| Compilar | `ng build` | Compila el proyecto en modo desarrollo |
| Compilar (producción) | `ng build --configuration production` | Compila optimizado para producción |
| Tests unitarios | `ng test` | Ejecuta los tests unitarios con Karma |
| Tests E2E | `ng e2e` | Ejecuta los tests end-to-end |
| Linter | `ng lint` | Valida el código con ESLint |

---

## 🧪 Pruebas

### Ejecutar tests unitarios:

```bash
ng test
```

### Ejecutar tests en modo observador (CI):

```bash
ng test --watch=false --browsers=ChromeHeadless
```

---

## 🔧 Solución de Problemas

### Error: "Cannot connect to API" - No puede conectar al backend

**Solución:** Asegúrate de que el backend esté corriendo antes de iniciar el frontend:

```bash
# En la carpeta backend/
npm run start:dev
```

### Puerto 4200 ya está en uso

**Solución:** Usa un puerto diferente:

```bash
ng serve --port 4300
```

### Error de CORS

**Solución:** Verifica que el backend tenga habilitado CORS para `http://localhost:4200`. Revisa la configuración en `main.ts` del backend.

### Módulos no encontrados tras `npm install`

**Solución:**

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Recursos Útiles

- [Documentación de Angular](https://angular.dev/)
- [Angular CLI Reference](https://angular.dev/tools/cli)
- [RxJS Documentation](https://rxjs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Última actualización:** Abril 2026 | **Versión:** 0.0.1
