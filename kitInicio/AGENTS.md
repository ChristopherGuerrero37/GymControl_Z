# GymControl Z

## El proyecto

[GymControl Z: Gestion de membresias e ingresos.]
la aplicacion utiliza un sistema de doble vista (Recepción/Dueño y Portal Cliente), done al mismo tiempo se van a maenejar un sistema de reservas de clases dentro del gimnasio y promociones para ocupar en el gimnasio.
Es un proyecto de portafolio de un estudiante principiante: el código debe ser sencillo y fácil de explicar.

## Tecnologías (no uses otras sin preguntar)

- Frontend (carpeta frontend/): React con Vite, React Router, Tailwind CSS, React Hook Form y Zod.
- Backend (carpeta backend/): Node.js con Express 5, módulos ES (import), mysql2/promise, dotenv, cors, bcryptjs, jsonwebtoken y zod.
- Base de datos: MySQL. Sin ORM: consultas SQL con parámetros (?).
- Gestor de paquetes: pnpm. No uses npm ni yarn.

## Estructura

- backend/src/index.js, backend/src/db.js, backend/src/routes/, backend/src/middlewares/, backend/src/schemas/, backend/database/ (scripts .sql), backend/pruebas.http (REST Client).
- frontend/src/pages/, frontend/src/components/, frontend/src/context/, frontend/src/schemas/.
- backend y frontend son repositorios de Git separados.

## Reglas de código

- Nombres de variables, funciones, comentarios y mensajes en español.
- Código sencillo para principiantes; comenta lo que no sea obvio.
- Toda ruta de la API valida los datos con Zod y responde con códigos correctos: 200, 201, 400, 401, 403, 404, 409 y 500.
- Las columnas de MySQL en snake_case; en JavaScript, camelCase (usa alias con AS).

## Reglas de seguridad (obligatorias)

- Contraseñas siempre con bcryptjs; nunca en texto plano ni en las respuestas de la API.
- El token JWT incluye id, rol y negocio_id. La clave va en JWT_SECRET del archivo .env.
- Toda consulta de datos de un negocio filtra por req.usuario.negocio_id (el del token), nunca por un negocio_id que envíe el navegador.
- Nunca escribas claves ni contraseñas en el código; usa .env y mantén .env en .gitignore.

## Forma de trabajar

- Antes de cambiar archivos, muestra un plan y espera mi aprobación.
- Un cambio pequeño a la vez; no modifiques lo que no te pedí.
- Al terminar, explica qué archivos cambiaste y cómo probarlo.
- Para cada ruta nueva de la API, agrega sus pruebas a backend/pruebas.http.

## Documentación del proyecto (léela antes de implementar)

- docs/propuesta.md: alcance aprobado y lo que está fuera del alcance. No agregues funcionalidades que no estén ahí.
- docs/reglas-negocio.md: reglas RN-XX que el sistema debe cumplir siempre. Toda regla se valida en la API (la validación del frontend es solo una ayuda).
- docs/historias.md: historias de usuario con sus criterios de aceptación. Trabaja una historia a la vez.
- docs/modelo-datos.md: tablas y relaciones acordadas. Si necesitas cambiar el modelo, propónlo y espera mi aprobación.
- Si algo no está definido en estos documentos, pregúntame en vez de suponer.

## Memoria del proyecto

- Al empezar una tarea, lee docs/progreso.md para conocer el estado del proyecto y lo pendiente.
- Al terminar una tarea, marca las tareas completadas en docs/progreso.md y agrega una entrada breve al registro de sesiones: qué hiciste, qué decidiste y qué quedó pendiente.
- Si tomas una decisión técnica importante, agrégala a la tabla de decisiones con su motivo.
- Para agregar una entidad nueva (tabla con su CRUD), usa la skill agregar-entidad.

## Definición de terminado (una historia está terminada solo si cumple todo)

- La API valida con Zod, filtra por negocio_id del token y responde con los códigos correctos.
- Cada regla de negocio involucrada tiene su prueba en backend/pruebas.http y pasa, incluida la prueba con otro negocio (404).
- La pantalla funciona en computadora y teléfono, con estados de carga, vacío y error.
- Los criterios de aceptación de la historia se cumplen.
- Hay un commit con un mensaje descriptivo (por ejemplo: "feat: HU-03 reservar cita (RN-01, RN-02)").
- docs/progreso.md está actualizado.

## No hagas

- No instales librerías que no estén en esta lista sin preguntarme.
- No borres archivos ni ejecutes comandos que borren datos sin preguntarme.
- No uses TypeScript.
