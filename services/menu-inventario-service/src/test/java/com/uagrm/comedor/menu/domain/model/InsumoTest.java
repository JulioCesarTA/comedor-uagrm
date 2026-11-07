package com.uagrm.comedor.menu.domain.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class InsumoTest {

    private Lote lote(String id, double valor, String unidad, LocalDate vence) {
        return new Lote(id, new Cantidad(valor, unidad), new FechaVencimiento(vence));
    }

    @Test
    void el_stock_es_la_suma_de_los_lotes() {
        Insumo i = new Insumo("arroz", "ARROZ", "kg", 5);
        i.registrarLote(lote("l1", 30, "kg", LocalDate.now().plusDays(30)));
        i.registrarLote(lote("l2", 20, "kg", LocalDate.now().plusDays(60)));
        assertEquals(50, i.stockTotal());
        assertFalse(i.tieneStockBajo());
    }

    @Test
    void stock_en_el_minimo_o_menos_es_bajo() {
        Insumo i = new Insumo("sal", "SAL", "kg", 1);
        assertTrue(i.tieneStockBajo());
        i.registrarLote(lote("l1", 1, "kg", LocalDate.now().plusDays(10)));
        assertTrue(i.tieneStockBajo());
        i.registrarLote(lote("l2", 1, "kg", LocalDate.now().plusDays(10)));
        assertFalse(i.tieneStockBajo());
    }

    @Test
    void no_acepta_un_lote_con_otra_unidad() {
        Insumo i = new Insumo("aceite", "ACEITE", "L", 2);
        assertThrows(IllegalArgumentException.class, () -> i.registrarLote(lote("l1", 5, "kg", LocalDate.now().plusDays(5))));
    }

    @Test
    void revisar_alertas_emite_stock_bajo_y_lote_vencido() {
        Insumo i = new Insumo("pollo", "POLLO", "kg", 10);
        i.registrarLote(lote("l1", 3, "kg", LocalDate.now().minusDays(1)));
        i.revisarAlertas(LocalDate.now());
        var tipos = i.pullEventos().stream().map(e -> e.type()).toList();
        assertEquals(java.util.List.of("StockBajoEvent", "LoteVencidoEvent"), tipos);
        assertTrue(i.pullEventos().isEmpty(), "los eventos se entregan una sola vez");
    }

    @Test
    void cantidad_negativa_o_sin_unidad_es_invalida() {
        assertThrows(IllegalArgumentException.class, () -> new Cantidad(-1, "kg"));
        assertThrows(IllegalArgumentException.class, () -> new Cantidad(1, " "));
    }
}
