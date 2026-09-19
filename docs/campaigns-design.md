# Diseño posterior: campañas de envío

Esta etapa documenta el contrato de producto; no añade pantallas, endpoints, workers ni envíos.
El flujo existente de QR, conexiones, tickets y agentes permanece fuera del alcance de campañas.

## Importación y validación

- Aceptar `.csv` y `.xlsx` desde la interfaz autenticada.
- Mostrar una previsualización antes de confirmar: encabezados, filas válidas, filas inválidas y
  columnas seleccionadas.
- Requerir una columna de teléfono; permitir columnas de nombre y variables para la plantilla.
- Normalizar números a formato internacional E.164: quitar espacios, signos, paréntesis y
  separadores; aplicar país predeterminado configurable solo cuando falte prefijo.
- Rechazar números con caracteres no permitidos, país desconocido o longitud imposible.
- Deduplicar por número normalizado dentro del archivo y contra destinatarios previamente
  incluidos en la campaña; conservar el primer registro y reportar los duplicados.
- No inferir números desde texto libre ni convertir una fila inválida en un envío.

## Selección y persistencia

- Seleccionar una conexión existente que esté `CONNECTED` y mostrar su nombre/proveedor.
- Guardar una instantánea de la conexión seleccionada, plantilla, variables, zona horaria y lista
  normalizada; un cambio posterior de contacto no debe alterar una campaña ya confirmada.
- Persistir campaña, destinatario, estado, intentos, timestamps y error público en MariaDB.
- Usar una cola durable respaldada por Redis con un identificador idempotente por campaña y
  destinatario. La base de datos es la fuente de verdad para recuperar trabajo tras reinicio.
- Estados de campaña: `draft`, `validated`, `queued`, `running`, `paused`, `completed`,
  `cancelled`, `failed`.
- Estados por destinatario: `pending`, `sending`, `sent`, `failed`, `skipped`; `sending` debe
  volver a `pending` si vence un lease durante un reinicio.

## Pausa, reanudación y límites

- Pausar no borra trabajos: evita tomar nuevos destinatarios y deja terminar el envío activo.
- Reanudar vuelve a encolar solo los destinatarios `pending` o cuyos leases hayan vencido.
- Cancelar impide nuevos envíos y marca los pendientes como `skipped`.
- Aplicar límites configurables por conexión y backoff ante errores transitorios; no reintentar de
  forma infinita ni esconder bloqueos del proveedor.

## Resultados y atención por agentes

- Mostrar progreso total y por estado, además de fecha del último intento.
- Exponer para cada destinatario el número normalizado, datos de origen, resultado, error legible,
  intentos y timestamps.
- Cuando exista respuesta entrante, procesarla por el mismo proveedor y flujo de tickets actual:
  crear o reabrir el ticket según las reglas existentes y mostrarla en la bandeja del agente.
- Vincular el resultado de campaña con contacto, mensaje y ticket sin sustituir la conversación
  normal del agente.
- Exportar resultados sin incluir secretos ni tokens.

## Límites explícitos

- No usar la API oficial de Meta como dependencia de esta edición.
- No usar scripts externos como interfaz operativa.
- No enviar antes de que el usuario confirme la previsualización y la conexión.
- La implementación futura debe añadir migraciones, permisos, auditoría y pruebas de reanudación
  antes de activar el envío.
