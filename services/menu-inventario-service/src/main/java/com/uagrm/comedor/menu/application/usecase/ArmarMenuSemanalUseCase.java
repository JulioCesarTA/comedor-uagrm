package com.uagrm.comedor.menu.application.usecase;

import com.uagrm.comedor.menu.application.dto.MenuDto;
import com.uagrm.comedor.menu.domain.model.Menu;
import com.uagrm.comedor.menu.domain.model.Turno;
import com.uagrm.comedor.menu.domain.repository.MenuRepository;
import com.uagrm.comedor.menu.domain.service.EventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ArmarMenuSemanalUseCase {
    private final MenuRepository menuRepo;
    private final EventPublisher publisher;

    public ArmarMenuSemanalUseCase(MenuRepository menuRepo, EventPublisher publisher) {
        this.menuRepo = menuRepo; this.publisher = publisher;
    }

    public record Entrada(LocalDate fecha, Turno turno, List<PlatoCupo> platos) {
        public record PlatoCupo(String platoId, int cupo) {}
    }

    public MenuDto ejecutar(Entrada e) {
        Menu menu = new Menu(UUID.randomUUID().toString(), e.fecha(), e.turno());
        for (var p : e.platos()) menu.agregarPlato(p.platoId(), p.cupo());
        menu.publicar();
        Menu saved = menuRepo.save(menu);
        publisher.publishAll(saved.pullEventos());
        return MenuDto.from(saved);
    }
}
