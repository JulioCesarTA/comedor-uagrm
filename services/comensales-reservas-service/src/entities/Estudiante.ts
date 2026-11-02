export class Estudiante {
  constructor(
    public readonly id: string,
    public readonly registroUniv: string,
    public readonly nombre: string,
    public readonly email: string,
    public readonly telefono?: string,
  ) {
    if (!registroUniv) throw new Error('registroUniv requerido');
    if (!nombre) throw new Error('nombre requerido');
  }
}
