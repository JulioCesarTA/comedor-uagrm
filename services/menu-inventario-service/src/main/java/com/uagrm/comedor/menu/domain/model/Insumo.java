package com.uagrm.comedor.menu.domain.model;

import com.uagrm.comedor.menu.domain.event.DomainEvent;
import com.uagrm.comedor.menu.domain.event.LoteVencidoEvent;
import com.uagrm.comedor.menu.domain.event.StockBajoEvent;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Agregado Insumo: stock repartido en lotes con vencimiento. El dominio no conoce la base de datos. */
public class Insumo {

    private final String id;
    private final String nombre;
    private final String unidad;
    private final double stockMinimo;
    private final List<Lote> lotes;
    private final List<DomainEvent> eventos = new ArrayList<>();

    public Insumo(String id, String nombre, String unidad, double stockMinimo) {
        this(id, nombre, unidad, stockMinimo, new ArrayList<>());
    }

    private Insumo(String id, String nombre, String unidad, double stockMinimo, List<Lote> lotes) {
        this.id = id;
        this.nombre = nombre;
        this.unidad = unidad;
        this.stockMinimo = stockMinimo;
        this.lotes = lotes;
    }

    /** Reconstruye un insumo ya guardado. Lo usa el repositorio. */
    public static Insumo reconstituir(String id, String nombre, String unidad, double stockMinimo, List<Lote> lotes) {
        return new Insumo(id, nombre, unidad, stockMinimo, new ArrayList<>(lotes));
    }

    public void registrarLote(Lote lote) {
        if (!lote.cantidad().unidad().equals(unidad))
            throw new IllegalArgumentException("Lote con unidad distinta al insumo");
        lotes.add(lote);
    }

    public double stockTotal() {
        return lotes.stream().mapToDouble(l -> l.cantidad().valor()).sum();
    }

    public boolean tieneStockBajo() {
        return stockTotal() <= stockMinimo;
    }

    public void revisarAlertas(LocalDate hoy) {
        if (tieneStockBajo()) {
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
    public List<Lote> getLotes() { return Collections.unmodifiableList(lotes); }
}
