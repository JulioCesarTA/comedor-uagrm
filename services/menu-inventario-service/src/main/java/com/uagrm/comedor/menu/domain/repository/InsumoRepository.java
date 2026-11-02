package com.uagrm.comedor.menu.domain.repository;

import com.uagrm.comedor.menu.domain.model.Insumo;
import java.util.List;
import java.util.Optional;

public interface InsumoRepository {
    Insumo save(Insumo insumo);
    Optional<Insumo> findById(String id);
    List<Insumo> findAll();
    List<Insumo> findStockBajo();
}
