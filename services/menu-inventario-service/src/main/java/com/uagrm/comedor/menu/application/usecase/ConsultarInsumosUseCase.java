package com.uagrm.comedor.menu.application.usecase;

import com.uagrm.comedor.menu.application.dto.InsumoDto;
import com.uagrm.comedor.menu.domain.model.Insumo;
import com.uagrm.comedor.menu.domain.repository.InsumoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConsultarInsumosUseCase {
    private final InsumoRepository repo;

    public ConsultarInsumosUseCase(InsumoRepository repo) { this.repo = repo; }

    public List<InsumoDto> listar() {
        return repo.findAll().stream().map(InsumoDto::from).toList();
    }

    /** Insumos cuyo stock total llegó al mínimo o quedó por debajo. */
    public List<InsumoDto> stockBajo() {
        return repo.findAll().stream().filter(Insumo::tieneStockBajo).map(InsumoDto::from).toList();
    }
}
