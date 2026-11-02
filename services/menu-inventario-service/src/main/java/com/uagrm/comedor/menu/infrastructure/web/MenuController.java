package com.uagrm.comedor.menu.infrastructure.web;

import com.uagrm.comedor.menu.application.dto.MenuDto;
import com.uagrm.comedor.menu.application.usecase.ApartarPorcionUseCase;
import com.uagrm.comedor.menu.application.usecase.ArmarMenuSemanalUseCase;
import com.uagrm.comedor.menu.application.usecase.LiberarPorcionUseCase;
import com.uagrm.comedor.menu.domain.model.Turno;
import com.uagrm.comedor.menu.domain.repository.MenuRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/menus")
public class MenuController {

    private final ArmarMenuSemanalUseCase armar;
    private final ApartarPorcionUseCase apartar;
    private final LiberarPorcionUseCase liberar;
    private final MenuRepository repo;

    public MenuController(ArmarMenuSemanalUseCase a, ApartarPorcionUseCase ap,
                          LiberarPorcionUseCase l, MenuRepository r) {
        this.armar = a; this.apartar = ap; this.liberar = l; this.repo = r;
    }

    @PostMapping
    public MenuDto crearMenu(@RequestBody ArmarMenuSemanalUseCase.Entrada body) {
        return armar.ejecutar(body);
    }

    @GetMapping("/semana/{turno}")
    public List<MenuDto> semana(@PathVariable Turno turno,
                                @RequestParam(required = false) String inicio) {
        LocalDate i = inicio != null ? LocalDate.parse(inicio) : LocalDate.now().with(java.time.DayOfWeek.MONDAY);
        return repo.findBySemana(i, turno).stream().map(MenuDto::from).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuDto> uno(@PathVariable String id) {
        return repo.findById(id).map(MenuDto::from).map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
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
