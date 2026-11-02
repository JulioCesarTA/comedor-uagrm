package com.uagrm.comedor.menu.domain.model;

import java.util.Objects;

/** Objeto de valor: cantidad numérica con unidad. */
public record Cantidad(double valor, String unidad) {
    public Cantidad {
        if (valor < 0) throw new IllegalArgumentException("Cantidad no puede ser negativa");
        Objects.requireNonNull(unidad, "unidad requerida");
        if (unidad.isBlank()) throw new IllegalArgumentException("unidad vacía");
    }
    public Cantidad sumar(Cantidad otra) {
        exigirMismaUnidad(otra);
        return new Cantidad(this.valor + otra.valor, this.unidad);
    }
    public Cantidad restar(Cantidad otra) {
        exigirMismaUnidad(otra);
        if (this.valor < otra.valor) throw new IllegalStateException("Cantidad insuficiente");
        return new Cantidad(this.valor - otra.valor, this.unidad);
    }
    private void exigirMismaUnidad(Cantidad otra) {
        if (!this.unidad.equals(otra.unidad))
            throw new IllegalArgumentException("Unidades distintas: " + unidad + " vs " + otra.unidad);
    }
}
