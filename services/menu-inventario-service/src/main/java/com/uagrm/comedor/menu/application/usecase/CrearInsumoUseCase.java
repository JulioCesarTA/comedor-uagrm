package com.uagrm.comedor.menu.application.usecase;

import com.uagrm.comedor.menu.application.dto.InsumoDto;
import com.uagrm.comedor.menu.domain.model.Insumo;
import com.uagrm.comedor.menu.domain.repository.InsumoRepository;
import org.springframework.stereotype.Service;

@Service
public class CrearInsumoUseCase {
    private final InsumoRepository repo;

    public CrearInsumoUseCase(InsumoRepository repo) { this.repo = repo; }

    public record Entrada(String id, String nombre, String unidad, double stockMinimo) {}

    public InsumoDto ejecutar(Entrada e) {
        return InsumoDto.from(repo.save(new Insumo(e.id(), e.nombre(), e.unidad(), e.stockMinimo())));
    }
}
