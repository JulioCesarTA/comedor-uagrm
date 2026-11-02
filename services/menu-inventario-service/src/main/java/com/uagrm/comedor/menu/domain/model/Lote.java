package com.uagrm.comedor.menu.domain.model;

public record Lote(String loteId, Cantidad cantidad, FechaVencimiento vencimiento) {
    public Lote consumir(Cantidad c) {
        return new Lote(loteId, cantidad.restar(c), vencimiento);
    }
}
