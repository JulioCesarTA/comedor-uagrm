package com.uagrm.comedor.menu.application.usecase;

import com.uagrm.comedor.menu.application.dto.MenuDto;
import com.uagrm.comedor.menu.domain.model.Turno;
import com.uagrm.comedor.menu.domain.repository.MenuRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ConsultarMenusUseCase {
    private final MenuRepository repo;

    public ConsultarMenusUseCase(MenuRepository repo) { this.repo = repo; }

    /** Menús de la semana que empieza en `inicio` (o en el lunes de esta semana si no se indica). */
    public List<MenuDto> semana(Turno turno, LocalDate inicio) {
        LocalDate desde = inicio != null ? inicio : LocalDate.now().with(DayOfWeek.MONDAY);
        return repo.findBySemana(desde, turno).stream().map(MenuDto::from).toList();
    }

    public Optional<MenuDto> porId(String id) {
        return repo.findById(id).map(MenuDto::from);
    }
}
