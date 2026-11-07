package com.uagrm.comedor.menu.infrastructure.persistence.mongo;

import com.uagrm.comedor.menu.domain.model.*;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/** El mapeo a Mongo no pierde datos: lo que se guarda es lo que se lee. */
class DocumentosTest {

    @Test
    void menu_ida_y_vuelta() {
        Menu m = new Menu("m1", LocalDate.of(2026, 11, 9), Turno.ALMUERZO);
        m.agregarPlato("plato-A", 50);
        m.agregarPlato("plato-B", 30);
        m.publicar();
        m.apartarPorcion("plato-A");

        Menu leido = MenuDocument.desde(m).aDominio();

        assertEquals("m1", leido.getId());
        assertEquals(LocalDate.of(2026, 11, 9), leido.getFecha());
        assertEquals(Turno.ALMUERZO, leido.getTurno());
        assertTrue(leido.isPublicado());
        assertEquals(49, leido.getPorciones().get("plato-A").disponibles());
        assertEquals(30, leido.getPorciones().get("plato-B").cupoTotal());
        assertTrue(leido.pullEventos().isEmpty(), "reconstituir no emite eventos");
    }

    @Test
    void insumo_ida_y_vuelta() {
        Insumo i = new Insumo("arroz-blanco", "ARROZ", "kg", 5);
        i.registrarLote(new Lote("lote-1", new Cantidad(50, "kg"), new FechaVencimiento(LocalDate.of(2026, 11, 9))));

        Insumo leido = InsumoDocument.desde(i).aDominio();

        assertEquals("ARROZ", leido.getNombre());
        assertEquals(5, leido.getStockMinimo());
        assertEquals(50, leido.stockTotal());
        assertEquals(LocalDate.of(2026, 11, 9), leido.getLotes().get(0).vencimiento().fecha());
    }
}
