package com.uagrm.comedor.menu.domain.event;

import com.uagrm.comedor.menu.domain.model.Turno;
import java.time.LocalDate;

public record PorcionApartadaEvent(String menuId, String platoId, LocalDate fecha, Turno turno) implements DomainEvent {}
