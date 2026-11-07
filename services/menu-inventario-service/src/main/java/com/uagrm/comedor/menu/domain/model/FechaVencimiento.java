package com.uagrm.comedor.menu.domain.model;

import java.time.LocalDate;

/** Objeto de valor: fecha en que un lote deja de ser usable. */
public record FechaVencimiento(LocalDate fecha) {
    public boolean estaVencida(LocalDate hoy) { return !fecha.isAfter(hoy); }
}
