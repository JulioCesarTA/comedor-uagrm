package com.uagrm.comedor.menu.infrastructure.web;

import com.uagrm.comedor.menu.application.dto.MenuDto;
import com.uagrm.comedor.menu.application.usecase.ApartarPorcionUseCase;
import com.uagrm.comedor.menu.application.usecase.ArmarMenuSemanalUseCase;
import com.uagrm.comedor.menu.application.usecase.LiberarPorcionUseCase;
import com.uagrm.comedor.menu.domain.model.Turno;
import com.uagrm.comedor.menu.application.usecase.ConsultarMenusUseCase;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/menus")
public class MenuController {

    private final ArmarMenuSemanalUseCase armar;
    private final ConsultarMenusUseCase consultar;

    public MenuController(ArmarMenuSemanalUseCase a, ConsultarMenusUseCase c) {
        this.armar = a; this.consultar = c;
    }

    @PostMapping
    public MenuDto crearMenu(@RequestBody ArmarMenuSemanalUseCase.Entrada body) {
        return armar.ejecutar(body);
    }

    @GetMapping("/semana/{turno}")
    public List<MenuDto> semana(@PathVariable Turno turno, @RequestParam(required = false) String inicio) {
        return consultar.semana(turno, inicio != null ? LocalDate.parse(inicio) : null);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuDto> uno(@PathVariable String id) {
        return consultar.porId(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}

@RestController
@RequestMapping("/porciones")
class PorcionesController {
    private final ApartarPorcionUseCase apartar;
    private final LiberarPorcionUseCase liberar;

    PorcionesController(ApartarPorcionUseCase a, LiberarPorcionUseCase l) {
        this.apartar = a; this.liberar = l;
    }

    /** Paso 2 saga: aparta porción. */
    @PostMapping("/apartar")
    public Map<String, Object> apartar(@RequestBody ApartarPorcionUseCase.Entrada e) {
        apartar.ejecutar(e);
        return Map.of("ok", true, "menuId", e.menuId(), "platoId", e.platoId());
    }

    /** Compensación saga: libera. */
    @PostMapping("/liberar")
    public Map<String, Object> liberar(@RequestBody LiberarPorcionUseCase.Entrada e) {
        liberar.ejecutar(e);
        return Map.of("ok", true, "liberada", true);
    }
}
