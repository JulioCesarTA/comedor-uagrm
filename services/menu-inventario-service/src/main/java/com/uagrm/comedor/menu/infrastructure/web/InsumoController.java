package com.uagrm.comedor.menu.infrastructure.web;

import com.uagrm.comedor.menu.application.usecase.RegistrarLoteUseCase;
import com.uagrm.comedor.menu.domain.model.Insumo;
import com.uagrm.comedor.menu.domain.repository.InsumoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/insumos")
public class InsumoController {

    private final InsumoRepository repo;
    private final RegistrarLoteUseCase registrarLote;

    public InsumoController(InsumoRepository r, RegistrarLoteUseCase u) {
        this.repo = r; this.registrarLote = u;
    }

    public record CrearInsumoReq(String id, String nombre, String unidad, double stockMinimo) {}

    @PostMapping
    public ResponseEntity<Insumo> crear(@RequestBody CrearInsumoReq r) {
        Insumo i = new Insumo(r.id(), r.nombre(), r.unidad(), r.stockMinimo());
        return ResponseEntity.ok(repo.save(i));
    }

    @GetMapping
    public List<Insumo> listar() { return repo.findAll(); }

    @GetMapping("/stock-bajo")
    public List<Insumo> stockBajo() { return repo.findStockBajo(); }

    @PostMapping("/lotes")
    public Map<String, Object> registrarLote(@RequestBody RegistrarLoteUseCase.Entrada e) {
        registrarLote.ejecutar(e);
        return Map.of("ok", true, "insumoId", e.insumoId(), "loteId", e.loteId());
    }
}
