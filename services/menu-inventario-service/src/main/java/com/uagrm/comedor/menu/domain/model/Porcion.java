package com.uagrm.comedor.menu.domain.model;

/** VO: una porción servible de un plato dentro de un menú. */
public record Porcion(String platoId, int cupoTotal, int apartadas) {
    public Porcion {
        if (cupoTotal < 0 || apartadas < 0) throw new IllegalArgumentException("Negativos no permitidos");
        if (apartadas > cupoTotal) throw new IllegalArgumentException("apartadas > cupoTotal");
    }
    public int disponibles() { return cupoTotal - apartadas; }
    public boolean hayDisponibles() { return disponibles() > 0; }
    public Porcion apartarUna() {
        if (!hayDisponibles()) throw new IllegalStateException("Sin porciones disponibles");
        return new Porcion(platoId, cupoTotal, apartadas + 1);
    }
    public Porcion liberarUna() {
        if (apartadas == 0) throw new IllegalStateException("Nada que liberar");
        return new Porcion(platoId, cupoTotal, apartadas - 1);
    }
}
