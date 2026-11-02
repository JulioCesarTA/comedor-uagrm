package com.uagrm.comedor.menu.domain.model;

import java.time.LocalDate;

public record FechaVencimiento(LocalDate fecha) {
    public boolean estaVencida(LocalDate hoy) { return !fecha.isAfter(hoy); }
    public boolean venceEn(LocalDate hoy, int dias) {
        return fecha.isAfter(hoy) && !fecha.isAfter(hoy.plusDays(dias));
    }
}
