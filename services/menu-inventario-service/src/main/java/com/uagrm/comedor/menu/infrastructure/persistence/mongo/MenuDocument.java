package com.uagrm.comedor.menu.infrastructure.persistence.mongo;

import com.uagrm.comedor.menu.domain.model.Menu;
import com.uagrm.comedor.menu.domain.model.Porcion;
import com.uagrm.comedor.menu.domain.model.Turno;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/** Forma en que se guarda un Menu en Mongo (colección "menus"). Mismos nombres de campo que ya hay guardados. */
@Document("menus")
class MenuDocument {

    @Id
    private String id;
    private LocalDate fecha;
    private Turno turno;
    private boolean publicado;
    private Map<String, PorcionDoc> porciones = new HashMap<>();

    static class PorcionDoc {
        private String platoId;
        private int cupoTotal;
        private int apartadas;

        PorcionDoc() {}
        PorcionDoc(String platoId, int cupoTotal, int apartadas) {
            this.platoId = platoId; this.cupoTotal = cupoTotal; this.apartadas = apartadas;
        }
    }

    static MenuDocument desde(Menu m) {
        MenuDocument d = new MenuDocument();
        d.id = m.getId();
        d.fecha = m.getFecha();
        d.turno = m.getTurno();
        d.publicado = m.isPublicado();
        m.getPorciones().forEach((k, p) -> d.porciones.put(k, new PorcionDoc(p.platoId(), p.cupoTotal(), p.apartadas())));
        return d;
    }

    Menu aDominio() {
        Map<String, Porcion> ps = new HashMap<>();
        porciones.forEach((k, p) -> ps.put(k, new Porcion(p.platoId, p.cupoTotal, p.apartadas)));
        return Menu.reconstituir(id, fecha, turno, publicado, ps);
    }
}
