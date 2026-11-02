package com.uagrm.comedor.menu.domain.model;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.*;

class MenuTest {

    @Test
    void no_se_publica_menu_vacio() {
        Menu m = new Menu("m1", LocalDate.now(), Turno.ALMUERZO);
        assertThrows(IllegalStateException.class, m::publicar);
    }

    @Test
    void publicar_bloquea_mas_cambios() {
        Menu m = new Menu("m1", LocalDate.now(), Turno.ALMUERZO);
        m.agregarPlato("plato-A", 100);
        m.publicar();
        assertTrue(m.isPublicado());
        assertThrows(IllegalStateException.class, () -> m.agregarPlato("plato-B", 10));
    }

    @Test
    void apartar_porcion_descuenta_cupo() {
        Menu m = new Menu("m1", LocalDate.now(), Turno.ALMUERZO);
        m.agregarPlato("plato-A", 2);
        m.publicar();
        m.apartarPorcion("plato-A");
        assertEquals(1, m.getPorciones().get("plato-A").disponibles());
    }

    @Test
    void no_apartar_si_no_hay_cupo() {
        Menu m = new Menu("m1", LocalDate.now(), Turno.ALMUERZO);
        m.agregarPlato("plato-A", 1);
        m.publicar();
        m.apartarPorcion("plato-A");
        assertThrows(IllegalStateException.class, () -> m.apartarPorcion("plato-A"));
    }

    @Test
    void liberar_devuelve_la_porcion_al_cupo() {
        Menu m = new Menu("m1", LocalDate.now(), Turno.ALMUERZO);
        m.agregarPlato("plato-A", 2);
        m.publicar();
        m.apartarPorcion("plato-A");
        m.liberarPorcion("plato-A");
        assertEquals(2, m.getPorciones().get("plato-A").disponibles());
    }

    @Test
    void apartar_emite_evento_de_dominio() {
        Menu m = new Menu("m1", LocalDate.now(), Turno.ALMUERZO);
        m.agregarPlato("plato-A", 2);
        m.publicar();
        m.apartarPorcion("plato-A");
        var ev = m.pullEventos();
        assertEquals(1, ev.size());
        assertEquals("PorcionApartadaEvent", ev.get(0).type());
    }
}
