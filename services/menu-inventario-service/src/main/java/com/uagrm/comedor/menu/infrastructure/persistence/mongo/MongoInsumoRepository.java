package com.uagrm.comedor.menu.infrastructure.persistence.mongo;

import com.uagrm.comedor.menu.domain.model.Insumo;
import com.uagrm.comedor.menu.domain.repository.InsumoRepository;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

interface SpringInsumoRepo extends MongoRepository<Insumo, String> {}

@Repository
public class MongoInsumoRepository implements InsumoRepository {
    private final SpringInsumoRepo repo;
    public MongoInsumoRepository(SpringInsumoRepo r) { this.repo = r; }

    @Override public Insumo save(Insumo i) { return repo.save(i); }
    @Override public Optional<Insumo> findById(String id) { return repo.findById(id); }
    @Override public List<Insumo> findAll() { return repo.findAll(); }
    @Override public List<Insumo> findStockBajo() {
        return repo.findAll().stream()
            .filter(i -> i.stockTotal() <= i.getStockMinimo())
            .toList();
    }
}
