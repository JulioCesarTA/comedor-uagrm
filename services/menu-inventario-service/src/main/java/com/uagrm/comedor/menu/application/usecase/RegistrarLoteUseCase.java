package com.uagrm.comedor.menu.application.usecase;

import com.uagrm.comedor.menu.domain.model.*;
import com.uagrm.comedor.menu.domain.repository.InsumoRepository;
import com.uagrm.comedor.menu.domain.service.EventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class RegistrarLoteUseCase {
    private final InsumoRepository repo;
    private final EventPublisher publisher;

    public RegistrarLoteUseCase(InsumoRepository r, EventPublisher p) {
        this.repo = r; this.publisher = p;
    }

    public record Entrada(String insumoId, String loteId, double cantidad, String unidad, LocalDate vence) {}

    public void ejecutar(Entrada e) {
        Insumo insumo = repo.findById(e.insumoId())
            .orElseThrow(() -> new IllegalArgumentException("Insumo no existe: " + e.insumoId()));
        insumo.registrarLote(new Lote(e.loteId(), new Cantidad(e.cantidad(), e.unidad()),
            new FechaVencimiento(e.vence())));
        insumo.revisarAlertas(LocalDate.now());
        repo.save(insumo);
        publisher.publishAll(insumo.pullEventos());
    }
}
