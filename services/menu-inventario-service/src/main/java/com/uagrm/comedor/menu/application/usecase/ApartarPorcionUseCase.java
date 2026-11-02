package com.uagrm.comedor.menu.application.usecase;

import com.uagrm.comedor.menu.domain.model.Menu;
import com.uagrm.comedor.menu.domain.repository.MenuRepository;
import com.uagrm.comedor.menu.domain.service.EventPublisher;
import org.springframework.stereotype.Service;

@Service
public class ApartarPorcionUseCase {
    private final MenuRepository menuRepo;
    private final EventPublisher publisher;

    public ApartarPorcionUseCase(MenuRepository m, EventPublisher p) {
        this.menuRepo = m; this.publisher = p;
    }

    public record Entrada(String menuId, String platoId) {}

    public void ejecutar(Entrada e) {
        Menu menu = menuRepo.findById(e.menuId())
            .orElseThrow(() -> new IllegalArgumentException("Menú no encontrado: " + e.menuId()));
        menu.apartarPorcion(e.platoId());
        menuRepo.save(menu);
        publisher.publishAll(menu.pullEventos());
    }
}
