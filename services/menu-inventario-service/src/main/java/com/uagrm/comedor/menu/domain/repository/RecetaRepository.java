package com.uagrm.comedor.menu.domain.repository;

import com.uagrm.comedor.menu.domain.model.Receta;
import java.util.List;
import java.util.Optional;

public interface RecetaRepository {
    Receta save(Receta receta);
    Optional<Receta> findById(String id);
    List<Receta> findAll();
}
