package com.uagrm.comedor.menu.domain.model;

import java.util.List;

/** Entidad: receta de un plato. */
public record Receta(String id,
                     String nombre,
                     List<Ingrediente> ingredientes,
                     List<String> pasos,
                     FichaNutricional ficha) {
    public record Ingrediente(String insumoId, Cantidad cantidad) {}

    public Receta {
        if (nombre == null || nombre.isBlank()) throw new IllegalArgumentException("Receta sin nombre");
        if (ingredientes == null || ingredientes.isEmpty())
            throw new IllegalArgumentException("Receta sin ingredientes");
    }
}
