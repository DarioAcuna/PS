# Backend - La Cúpula EJJB

## Descripción

Este directorio contiene el backend del proyecto **La Cúpula EJJB**, desarrollado como parte del Sprint 0.

Su objetivo es proporcionar la base técnica del sistema:
- conexión a base de datos PostgreSQL
- gestión de datos con Prisma
- API REST con NestJS
- endpoints para las entidades principales del prototipo

Actualmente el backend cubre:
- health check
- CRUD de clases
- CRUD de horarios
- gestión de sesiones
- CRUD de anuncios

---

## Tecnologías utilizadas

- **NestJS** para la API backend
- **TypeScript** como lenguaje principal
- **Prisma ORM** para acceso a base de datos
- **PostgreSQL** como sistema de base de datos
- **Docker / Docker Compose** para levantar PostgreSQL
- **Postman** para pruebas manuales de endpoints

---

## Estructura del backend

```text
backend/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── anuncios/
│   ├── clases/
│   ├── horarios/
│   ├── sesiones/
│   ├── prisma/
│   ├── app.controller.ts
│   ├── app.module.ts
│   └── main.ts
├── .env
├── nest-cli.json
├── package.json
├── prisma.config.ts
└── tsconfig.json