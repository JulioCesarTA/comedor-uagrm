package com.uagrm.comedor.menu.domain.model;

/** Objeto de valor: una partida de un insumo con su cantidad y fecha de vencimiento. */
public record Lote(String loteId, Cantidad cantidad, FechaVencimiento vencimiento) {}
