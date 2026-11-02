package com.uagrm.comedor.menu.domain.model;

import com.uagrm.comedor.menu.domain.event.DomainEvent;
import com.uagrm.comedor.menu.domain.event.PorcionApartadaEvent;
import com.uagrm.comedor.menu.domain.event.PorcionLiberadaEvent;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Agregado raíz Menu. Reglas de invariante:
 *  - no se publica un menú sin al menos un plato con porciones
 *  - no se aparta una porción si no hay disponibles
 */
@Document("menus")
public class Menu {

    @Id
    private String id;
    private LocalDate fecha;
    private Turno turno;
    private boolean publicado;
    /** platoId -> Porcion */
    private Map<String, Porcion> porciones = new HashMap<>();

    @Transient
    private final List<DomainEvent> eventos = new ArrayList<>();

    protected Menu() {}

    public Menu(String id, LocalDate fecha, Turno turno) {
        this.id = id;
        this.fecha = fecha;
        this.turno = turno;
        this.publicado = false;
    }

    public void agregarPlato(String platoId, int cupo) {
        if (publicado) throw new IllegalStateException("No se puede modificar un menú publicado");
        porciones.put(platoId, new Porcion(platoId, cupo, 0));
    }

    public void publicar() {
        if (porciones.isEmpty())
            throw new IllegalStateException("No se publica un menú sin platos");
        this.publicado = true;
    }

    /** Paso 2 de la Saga 1. */
    public void apartarPorcion(String platoId) {
        Porcion p = porciones.get(platoId);
        if (p == null) throw new IllegalArgumentException("Plato no está en el menú: " + platoId);
        porciones.put(platoId, p.apartarUna());
        eventos.add(new PorcionApartadaEvent(id, platoId, fecha, turno));
    }

    /** Compensación de la Saga 1. */
    public void liberarPorcion(String platoId) {
        Porcion p = porciones.get(platoId);
        if (p == null) throw new IllegalArgumentException("Plato no está en el menú: " + platoId);
        porciones.put(platoId, p.liberarUna());
        eventos.add(new PorcionLiberadaEvent(id, platoId, fecha, turno));
    }

    public List<DomainEvent> pullEventos() {
        List<DomainEvent> out = new ArrayList<>(eventos);
        eventos.clear();
        return out;
    }

    public String getId() { return id; }
    public LocalDate getFecha() { return fecha; }
    public Turno getTurno() { return turno; }
    public boolean isPublicado() { return publicado; }
    public Map<String, Porcion> getPorciones() { return porciones; }

    public void setId(String id) { this.id = id; }
    public void setFecha(LocalDate f) { this.fecha = f; }
    public void setTurno(Turno t) { this.turno = t; }
    public void setPublicado(boolean p) { this.publicado = p; }
    public void setPorciones(Map<String, Porcion> p) { this.porciones = p; }
}
