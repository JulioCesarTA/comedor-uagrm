package com.uagrm.comedor.menu.domain.repository;

import com.uagrm.comedor.menu.domain.model.Menu;
import com.uagrm.comedor.menu.domain.model.Turno;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MenuRepository {
    Menu save(Menu menu);
    Optional<Menu> findById(String id);
    List<Menu> findBySemana(LocalDate inicioSemana, Turno turno);
    Optional<Menu> findByFechaYTurno(LocalDate fecha, Turno turno);
}
