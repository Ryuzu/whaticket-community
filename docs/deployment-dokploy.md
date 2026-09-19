# Despliegue en Dokploy

Esta edición se despliega como un proyecto Docker Compose usando `docker-compose.yml`.
No usar `docker-compose.yaml`: fue retirado porque definía otra topología sin Redis y podía
ser seleccionado ambiguamente por Compose.

## 1. Crear el proyecto

1. En Dokploy, crear un proyecto y un servicio **Compose** apuntando a la rama
   `development/modernizacion-whaticket`.
2. Configurar el repositorio Git y habilitar el despliegue automático solo para la rama del PR
   cuando el cambio haya sido revisado.
3. Definir los dominios de frontend y backend. El backend debe ser accesible desde el frontend
   y ambos valores deben coincidir con `FRONTEND_URL` y `BACKEND_URL`.

## 2. Variables obligatorias

Copiar `.env.example` como referencia y configurar valores secretos propios:

- `MYSQL_ROOT_PASSWORD`, `DB_PASSWORD`, `MYSQL_DATABASE`, `DB_USER`.
- `JWT_SECRET` y `JWT_REFRESH_SECRET` con valores largos, aleatorios y distintos.
- `BACKEND_URL` y `FRONTEND_URL` con esquema (`https://`) y dominio público.
- `WHATSAPP_PROVIDER`: `wwebjs` (Puppeteer/QR) o `whaileys` (WebSocket/QR).
- `TZ`, `REDIS_DB` y `CHROME_ARGS` según la infraestructura.

No colocar secretos en Git ni reutilizar los valores de ejemplo.

## 3. Persistencia y orden de arranque

El Compose declara estos volúmenes nombrados; configurarlos como almacenamiento persistente de
Dokploy y no eliminarlos al redeploy:

- `mysql_data`: datos de MariaDB.
- `redis_data`: AOF de Redis y estado durable auxiliar.
- `backend_public`: archivos enviados.
- `backend_auth`: credenciales de `whatsapp-web.js` (`LocalAuth`).

MariaDB y Redis tienen healthchecks. El backend espera ambos servicios, ejecuta migraciones al
arrancar y expone `GET /healthz`; el frontend espera al backend saludable.

Para `whaileys`, las credenciales y claves Signal se guardan en MariaDB mediante las migraciones
`WppKeys`. Redis conserva su propia persistencia AOF, pero no sustituye el volumen de base de
datos.

## 4. Primer despliegue

```bash
cp .env.example .env
# editar .env con secretos y URLs reales
docker compose config --quiet
docker compose up -d --build
# solo la primera instalación
docker compose exec backend npx sequelize db:seed:all
```

Las migraciones se ejecutan automáticamente en el `CMD` del backend. No ejecutar seeds en cada
redeploy: los seeds iniciales no son el mecanismo de migración.

## 5. Verificación operativa

1. Abrir `FRONTEND_URL` e iniciar sesión.
2. Ir a **Connections**, crear una conexión y escanear el QR.
3. Comprobar que el estado pasa a `CONNECTED`.
4. Enviar un mensaje al número conectado, aceptar el ticket y responder desde la bandeja.
5. Reiniciar solo el servicio backend desde Dokploy.
6. Confirmar que la conexión vuelve a `CONNECTED` sin escanear un QR nuevo y que el ticket sigue
   visible.

La prueba QR requiere un teléfono y una cuenta de WhatsApp. Si no están disponibles, queda
pendiente antes de producción.

## Operación y rollback

- Revisar logs del backend y del worker de navegador antes de reiniciar repetidamente.
- Respaldar MariaDB y Redis antes de cambios de esquema.
- No borrar volúmenes para corregir un fallo de sesión; primero revisar el proveedor, permisos y
  logs.
- Para rollback, volver a una imagen/commit anterior manteniendo los volúmenes. Una migración
  aplicada no se deshace automáticamente: evaluar su `down` antes de ejecutar un rollback.
