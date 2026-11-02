package com.uagrm.comedor.menu.domain.service;

import com.uagrm.comedor.menu.domain.event.DomainEvent;
import java.util.List;

/** Puerto de salida: publica eventos de dominio al bus. */
public interface EventPublisher {
    void publishAll(List<DomainEvent> events);
}
