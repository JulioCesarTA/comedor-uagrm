package com.uagrm.comedor.menu.domain.event;

import java.time.LocalDate;

public record LoteVencidoEvent(String insumoId, String loteId, LocalDate vencimiento) implements DomainEvent {}
