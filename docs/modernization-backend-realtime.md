# Modernización backend y tiempo real

Esta rama aplica las fases A, B y C sobre `development/update-deps`.

## Fase A: dependencias y tooling

- Node.js mínimo 20, con tipos `@types/node` alineados con Node 22.
- JWT actualizado a 9.x; las expiraciones se tipan con `SignOptions`.
- Multer actualizado a 2.x.
- MySQL2 actualizado a 3.x.
- Dotenv actualizado a 16.x.
- Jest 29, ts-jest 29, Supertest 7 y TypeScript 5.9.
- ESLint 8, TypeScript ESLint 7 y Prettier 3.

El build TypeScript pasa. El lint revela deuda preexistente del proyecto (85 diagnósticos,
principalmente `no-explicit-any`, imports CommonJS de migraciones y reglas de estilo); no se
ocultaron esos diagnósticos ni se reescribió todo el código como parte de esta fase.

## Fase B: Sequelize 6

Versiones fijadas:

- `sequelize` 6.37.8.
- `sequelize-cli` 6.6.3.
- `sequelize-typescript` 2.1.6.

Cambios necesarios:

- `.sequelizerc` usa `models-path`; Sequelize CLI 6 rechaza el antiguo `modules-path`.
- Los modelos declaran atributos de creación compatibles con el tipado estricto de
  `sequelize-typescript` 2.
- Las columnas nullable con uniones TypeScript declaran explícitamente `DataType.INTEGER` para
  conservar metadata válida en runtime.
- La consulta de respuestas rápidas usa `Sequelize.where` como condición completa, compatible con
  los tipos de Sequelize 6.

No se añadieron migraciones de esquema: el contrato de datos existente debe permanecer intacto.

## Fase C: Socket.IO 4

- Backend y frontend usan Socket.IO 4.8.3 juntos.
- La autenticación nueva usa `handshake.auth.token`.
- Se conserva lectura del token por query como compatibilidad temporal con clientes antiguos.
- El cliente usa reconexión, backoff y solo conecta automáticamente cuando existe token.
- Se mantienen los eventos existentes de tickets, contactos, usuarios, conexiones y notificaciones.

## Verificación

Correcto:

- `npm ci --dry-run` backend y frontend.
- `npm run build` backend con Sequelize 6 y Socket.IO 4.
- `npm run build` frontend con Socket.IO 4.
- Smoke realtime con JWT firmado: conexión Socket.IO establecida correctamente.
- `npx sequelize --version`: CLI 6.6.3 / ORM 6.37.8.

Pendiente de infraestructura:

- Migraciones, seeds y Jest requieren MariaDB en `127.0.0.1:3306`.
- El entorno de desarrollo no tiene acceso al daemon Docker, por lo que no fue posible levantar
  MariaDB/Redis con Compose.
- Debe ejecutarse una prueba de reconexión con el backend reiniciado y una prueba de eventos de
  ticket contra una base de datos real.

## Rollback

Los commits son independientes por fase:

1. `2badd1f` — dependencias y tooling backend.
2. `e5182cf` — Sequelize 6 y ajustes de modelos.
3. `4c39df2` — Socket.IO 4 y autenticación realtime.
4. `adbb05e` — metadata explícita para columnas nullable.

Para volver atrás, revertir en orden inverso y mantener el lockfile correspondiente. No ejecutar
`sequelize db:migrate:undo:all` en una instalación productiva como mecanismo genérico de rollback;
esta rama no cambia el esquema, pero cualquier migración futura debe tener un plan de reversión
específico.
