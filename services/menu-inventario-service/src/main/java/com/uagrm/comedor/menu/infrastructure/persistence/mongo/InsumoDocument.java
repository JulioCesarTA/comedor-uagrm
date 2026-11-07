package com.uagrm.comedor.menu.infrastructure.persistence.mongo;

import com.uagrm.comedor.menu.domain.model.Cantidad;
import com.uagrm.comedor.menu.domain.model.FechaVencimiento;
import com.uagrm.comedor.menu.domain.model.Insumo;
import com.uagrm.comedor.menu.domain.model.Lote;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Forma en que se guarda un Insumo en Mongo (colección "insumos"). Mismos nombres de campo que ya hay guardados. */
@Document("insumos")
class InsumoDocument {

    @Id
    private String id;
    private String nombre;
    private String unidad;
    private double stockMinimo;
    private List<LoteDoc> lotes = new ArrayList<>();

    static class LoteDoc {
        private String loteId;
        private CantidadDoc cantidad;
        private VencimientoDoc vencimiento;
    }

    static class CantidadDoc {
        private double valor;
        private String unidad;

        CantidadDoc() {}
        CantidadDoc(double valor, String unidad) { this.valor = valor; this.unidad = unidad; }
    }

    static class VencimientoDoc {
        private LocalDate fecha;

        VencimientoDoc() {}
        VencimientoDoc(LocalDate fecha) { this.fecha = fecha; }
    }

    static InsumoDocument desde(Insumo i) {
        InsumoDocument d = new InsumoDocument();
        d.id = i.getId();
        d.nombre = i.getNombre();
        d.unidad = i.getUnidad();
        d.stockMinimo = i.getStockMinimo();
        for (Lote l : i.getLotes()) {
            LoteDoc ld = new LoteDoc();
            ld.loteId = l.loteId();
            ld.cantidad = new CantidadDoc(l.cantidad().valor(), l.cantidad().unidad());
            ld.vencimiento = new VencimientoDoc(l.vencimiento().fecha());
            d.lotes.add(ld);
        }
        return d;
    }

    Insumo aDominio() {
        List<Lote> ls = lotes.stream()
            .map(l -> new Lote(l.loteId, new Cantidad(l.cantidad.valor, l.cantidad.unidad), new FechaVencimiento(l.vencimiento.fecha)))
            .toList();
        return Insumo.reconstituir(id, nombre, unidad, stockMinimo, ls);
    }
}
