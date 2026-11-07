package com.uagrm.comedor.menu.application.dto;

import com.uagrm.comedor.menu.domain.model.Insumo;

import java.time.LocalDate;
import java.util.List;

/** Lo que la API entrega de un insumo (el modelo de dominio no sale de la aplicación). */
public record InsumoDto(String id, String nombre, String unidad, double stockMinimo, List<LoteDto> lotes) {
    public record LoteDto(String loteId, CantidadDto cantidad, VencimientoDto vencimiento) {}
    public record CantidadDto(double valor, String unidad) {}
    public record VencimientoDto(LocalDate fecha) {}

    public static InsumoDto from(Insumo i) {
        return new InsumoDto(i.getId(), i.getNombre(), i.getUnidad(), i.getStockMinimo(),
            i.getLotes().stream().map(l -> new LoteDto(l.loteId(),
                new CantidadDto(l.cantidad().valor(), l.cantidad().unidad()),
                new VencimientoDto(l.vencimiento().fecha()))).toList());
    }
}
