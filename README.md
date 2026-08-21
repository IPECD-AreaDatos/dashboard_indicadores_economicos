# dashboard_indicadores_economicos

## Descripción

Proyecto de dashboard interactivo migrado a **Next.js + React** que consume datos desde PostgreSQL.

El objetivo es replicar y modernizar un tablero Power BI con:

- Menú lateral fijo
- Páginas por hoja (Resumen, IPC, Empleo, Indicadores, IPI/IERIC)
- Backend integrado en Next.js con rutas API internas
- Conexión directa a PostgreSQL usando `pg`

## Stack tecnológico

- Frontend: **Next.js App Router** + React
- Estilos: CSS global con posibilidad de CSS Modules
- Base de datos: **PostgreSQL** con `pg`
- APIs internas: rutas de servidor en `src/app/api`
- Iconografía: `lucide-react`
- Gráficos: `recharts`

## Estructura del proyecto

```text
dashboard_indicadores_economicos/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts
│   │   │   ├── ipc/route.ts
│   │   │   ├── ripte/route.ts
│   │   │   └── smvm/route.ts
│   │   ├── dashboard/
│   │   │   ├── ipc/page.tsx
│   │   │   ├── empleo/page.tsx
│   │   │   ├── indicadores/page.tsx
│   │   │   ├── ipi/page.tsx
│   │   │   └── page.tsx
│   │   ├── login/page.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   └── Sidebar.tsx
│   └── lib/
│       └── db.ts
├── .env.example
├── next.config.mjs
├── package.json
├── tsconfig.json
└── README.md
```

## Requisitos

- Node.js 18+ instalado
- PostgreSQL accesible desde la red
- Credenciales válidas para la base de datos

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto copiando `.env.example`.

### Ejemplo básico

```env
DATALAKE_URL=postgresql://usuario:password@host:5432/datalake_economico
DWH_URL=postgresql://usuario:password@host:5432/dwh_economico
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=un_string_super_seguro
```

### Soporte para SQLAlchemy-style URLs

Si tu URL viene como:

```env
DATALAKE_URL=postgresql+psycopg2://usuario:password@host:5432/datalake_economico
```

El backend normaliza automáticamente la conexión a `postgresql://`.

### Variables opcionales adicionales

Puedes mantenerlas en el `.env` solo para documentación interna:

```env
HOST_DBB2=149.50.145.182
PORT_DBB2=5432
USER_DBB2=IPECD_Manuela
PASSWORD_DBB2=IPECdatos.2026
DB_DATALAKE=datalake_economico
DB_DWH=dwh_economico
```

## Instalación

```bash
npm install
```

## Levantar el proyecto

```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

npm run dev
```

Luego abrí en el navegador:

```text
http://localhost:3000/indicadores-economicos/dashboard
http://localhost:3000
```

## Endpoints disponibles

- `GET /api/health` — estado del backend
- `GET /api/ipc` — datos de la tabla `public.ipc`
- `GET /api/ripte` — datos de la tabla `public.ripte`
- `GET /api/smvm` — datos de la tabla `public.salario_mvm`

## Notas

- No subas `.env` al repositorio.
- La conexión PostgreSQL se gestiona en `src/lib/db.ts`.
- Las rutas API internas están en `src/app/api`.
- El frontend y el backend están en el mismo proyecto Next.js.

## Próximos pasos

1. Verificar que `npm run dev` levante correctamente
2. Enlazar cada página con su endpoint real
3. Crear visualizaciones interactivas con `recharts`
4. Agregar NextAuth si querés manejar usuarios y RBAC

---

Podemos seguir ahora con un `TABLES.md` que liste las tablas clave de `datalake_economico` y `dwh_economico`.
En otra terminal:

```bash
npm run dev
```

Luego abrí en el navegador:

```text
http://localhost:5173
```

## Endpoints disponibles

- `GET /api/health` — estado del backend
- `GET /api/ipc` — obtiene datos de la tabla `public.ipc`
- `GET /api/ripte` — obtiene datos de la tabla `public.ripte`
- `GET /api/smvm` — obtiene datos de la tabla `public.salario_mvm`

## Notas

- No subas `.env` al repositorio.
- Si necesitás más endpoints, agregamos nuevas rutas en `server.js`.
- El frontend usa el proxy de Vite para evitar CORS y redirigir llamadas `/api/*` a `http://localhost:4000`.

## Próximos pasos

1. Validar que la API se conecta correctamente a PostgreSQL
2. Enlazar cada página con su endpoint correspondiente
3. Crear componentes/visualizaciones para cada hoja del tablero Power BI

---

Si querés, ahora puedo agregar un documento `TABLES.md` con las tablas clave que podemos usar del `datalake_economico` y del `dwh_economico`.