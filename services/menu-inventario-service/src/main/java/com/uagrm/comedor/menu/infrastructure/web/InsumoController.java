package com.uagrm.comedor.menu.infrastructure.web;

import com.uagrm.comedor.menu.application.dto.InsumoDto;
import com.uagrm.comedor.menu.application.usecase.ConsultarInsumosUseCase;
import com.uagrm.comedor.menu.application.usecase.CrearInsumoUseCase;
import com.uagrm.comedor.menu.application.usecase.RegistrarLoteUseCase;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/insumos")
public class InsumoController {

    private final CrearInsumoUseCase crearInsumo;
    private final ConsultarInsumosUseCase consultarInsumos;
    private final RegistrarLoteUseCase registrarLote;

    public InsumoController(CrearInsumoUseCase c, ConsultarInsumosUseCase q, RegistrarLoteUseCase u) {
        this.crearInsumo = c; this.consultarInsumos = q; this.registrarLote = u;
    }

    @PostMapping
    public InsumoDto crear(@RequestBody CrearInsumoUseCase.Entrada e) { return crearInsumo.ejecutar(e); }

    @GetMapping
    public List<InsumoDto> listar() { return consultarInsumos.listar(); }

    @GetMapping("/stock-bajo")
    public List<InsumoDto> stockBajo() { return consultarInsumos.stockBajo(); }

    @PostMapping("/lotes")
    public Map<String, Object> registrarLote(@RequestBody RegistrarLoteUseCase.Entrada e) {
        registrarLote.ejecutar(e);
        return Map.of("ok", true, "insumoId", e.insumoId(), "loteId", e.loteId());
    }
}
