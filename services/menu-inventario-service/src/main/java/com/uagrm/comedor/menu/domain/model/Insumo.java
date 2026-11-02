package com.uagrm.comedor.menu.domain.model;

import com.uagrm.comedor.menu.domain.event.DomainEvent;
import com.uagrm.comedor.menu.domain.event.LoteVencidoEvent;
import com.uagrm.comedor.menu.domain.event.StockBajoEvent;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Document("insumos")
public class Insumo {

    @Id
    private String id;
    private String nombre;
    private String unidad;
    private double stockMinimo;
    private List<Lote> lotes = new ArrayList<>();

    @Transient
    private final List<DomainEvent> eventos = new ArrayList<>();

    protected Insumo() {}

    public Insumo(String id, String nombre, String unidad, double stockMinimo) {
        this.id = id;
        this.nombre = nombre;
        this.unidad = unidad;
        this.stockMinimo = stockMinimo;
    }

    public void registrarLote(Lote lote) {
        if (!lote.cantidad().unidad().equals(unidad))
            throw new IllegalArgumentException("Lote con unidad distinta al insumo");
        lotes.add(lote);
    }

    public double stockTotal() {
        return lotes.stream().mapToDouble(l -> l.cantidad().valor()).sum();
    }

    public void revisarAlertas(LocalDate hoy) {
        if (stockTotal() <= stockMinimo) {
            eventos.add(new StockBajoEvent(id, nombre, stockTotal(), stockMinimo));
        }
        for (Lote l : lotes) {
            if (l.vencimiento().estaVencida(hoy)) {
                eventos.add(new LoteVencidoEvent(id, l.loteId(), l.vencimiento().fecha()));
            }
        }
    }

    public List<DomainEvent> pullEventos() {
        List<DomainEvent> out = new ArrayList<>(eventos);
        eventos.clear();
        return out;
    }

    public String getId() { return id; }
    public String getNombre() { return nombre; }
    public String getUnidad() { return unidad; }
    public double getStockMinimo() { return stockMinimo; }
    public List<Lote> getLotes() { return lotes; }

    public void setId(String id) { this.id = id; }
    public void setNombre(String n) { this.nombre = n; }
    public void setUnidad(String u) { this.unidad = u; }
    public void setStockMinimo(double s) { this.stockMinimo = s; }
    public void setLotes(List<Lote> l) { this.lotes = l; }
}
