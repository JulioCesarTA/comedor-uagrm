package com.uagrm.comedor.menu.domain.event;

import java.time.Instant;

public interface DomainEvent {
    default Instant occurredOn() { return Instant.now(); }
    default String type() { return getClass().getSimpleName(); }
}
