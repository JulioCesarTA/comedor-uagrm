package com.uagrm.comedor.menu.domain.model;

import java.math.BigDecimal;

public record Plato(String id, String nombre, String recetaId, BigDecimal precio) {
    public Plato {
        if (nombre == null || nombre.isBlank()) throw new IllegalArgumentException("Plato sin nombre");
        if (precio == null || precio.signum() < 0) throw new IllegalArgumentException("Precio inválido");
    }
}
