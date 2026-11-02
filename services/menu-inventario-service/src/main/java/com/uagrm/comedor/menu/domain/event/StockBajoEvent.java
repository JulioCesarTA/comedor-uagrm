package com.uagrm.comedor.menu.domain.event;

public record StockBajoEvent(String insumoId, String nombre, double stockActual, double stockMinimo) implements DomainEvent {}
