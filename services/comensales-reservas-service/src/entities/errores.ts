// Errores del negocio: los lanza el núcleo (entidades y casos de uso) y la capa de interfaz los traduce a HTTP.

/** Una regla de negocio impide la operación (p. ej. ya hay una reserva ese día). */
export class ReglaDeNegocioError extends Error {}

/** Lo que se pidió no existe. */
export class NoEncontradoError extends Error {}
