package com.uagrm.comedor.menu.domain.model;

import java.util.Objects;

/** Objeto de valor: cantidad numérica con unidad. */
public record Cantidad(double valor, String unidad) {
    public Cantidad {
        if (valor < 0) throw new IllegalArgumentException("Cantidad no puede ser negativa");
        Objects.requireNonNull(unidad, "unidad requerida");
        if (unidad.isBlank()) throw new IllegalArgumentException("unidad vacía");
    }
}
