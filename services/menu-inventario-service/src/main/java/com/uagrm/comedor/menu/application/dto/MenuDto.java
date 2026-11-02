package com.uagrm.comedor.menu.application.dto;

import com.uagrm.comedor.menu.domain.model.Menu;
import com.uagrm.comedor.menu.domain.model.Porcion;
import com.uagrm.comedor.menu.domain.model.Turno;

import java.time.LocalDate;
import java.util.Map;
import java.util.stream.Collectors;

public record MenuDto(String id, LocalDate fecha, Turno turno, boolean publicado,
                      Map<String, PorcionDto> porciones) {
    public record PorcionDto(int cupo, int apartadas, int disponibles) {}

    public static MenuDto from(Menu m) {
        Map<String, PorcionDto> ps = m.getPorciones().entrySet().stream().collect(Collectors.toMap(
            Map.Entry::getKey,
            e -> {
                Porcion p = e.getValue();
                return new PorcionDto(p.cupoTotal(), p.apartadas(), p.disponibles());
            }));
        return new MenuDto(m.getId(), m.getFecha(), m.getTurno(), m.isPublicado(), ps);
    }
}
