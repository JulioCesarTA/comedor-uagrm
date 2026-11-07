package com.uagrm.comedor.menu.domain.model;

import com.uagrm.comedor.menu.domain.event.DomainEvent;
import com.uagrm.comedor.menu.domain.event.PorcionApartadaEvent;
import com.uagrm.comedor.menu.domain.event.PorcionLiberadaEvent;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Agregado raíz Menu. Reglas de invariante:
 *  - no se publica un menú sin al menos un plato con porciones
 *  - no se aparta una porción si no hay disponibles
 *
 * El dominio no conoce la base de datos: el mapeo a Mongo vive en infrastructure.persistence.
 */
public class Menu {

    private final String id;
    private final LocalDate fecha;
    private final Turno turno;
    private boolean publicado;
    /** platoId -> Porcion */
    private final Map<String, Porcion> porciones;
    private final List<DomainEvent> eventos = new ArrayList<>();

    public Menu(String id, LocalDate fecha, Turno turno) {
        this(id, fecha, turno, false, new HashMap<>());
    }

    private Menu(String id, LocalDate fecha, Turno turno, boolean publicado, Map<String, Porcion> porciones) {
        this.id = id;
        this.fecha = fecha;
        this.turno = turno;
        this.publicado = publicado;
        this.porciones = porciones;
    }

    /** Reconstruye un menú ya guardado (sin emitir eventos ni revalidar). Lo usa el repositorio. */
    public static Menu reconstituir(String id, LocalDate fecha, Turno turno, boolean publicado, Map<String, Porcion> porciones) {
        return new Menu(id, fecha, turno, publicado, new HashMap<>(porciones));
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
        Porcion p = porcion(platoId);
        porciones.put(platoId, p.apartarUna());
        eventos.add(new PorcionApartadaEvent(id, platoId, fecha, turno));
    }

    /** Compensación de la Saga 1. */
    public void liberarPorcion(String platoId) {
        Porcion p = porcion(platoId);
        porciones.put(platoId, p.liberarUna());
        eventos.add(new PorcionLiberadaEvent(id, platoId, fecha, turno));
    }

    private Porcion porcion(String platoId) {
        Porcion p = porciones.get(platoId);
        if (p == null) throw new IllegalArgumentException("Plato no está en el menú: " + platoId);
        return p;
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
    public Map<String, Porcion> getPorciones() { return Collections.unmodifiableMap(porciones); }
}
