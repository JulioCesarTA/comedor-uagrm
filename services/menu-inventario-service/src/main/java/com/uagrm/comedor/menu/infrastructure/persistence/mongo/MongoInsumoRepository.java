package com.uagrm.comedor.menu.infrastructure.persistence.mongo;

import com.uagrm.comedor.menu.domain.model.Insumo;
import com.uagrm.comedor.menu.domain.repository.InsumoRepository;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

interface SpringInsumoRepo extends MongoRepository<InsumoDocument, String> {}

/** Adaptador de salida: implementa el puerto InsumoRepository del dominio sobre Mongo. */
@Repository
public class MongoInsumoRepository implements InsumoRepository {
    private final SpringInsumoRepo repo;
    public MongoInsumoRepository(SpringInsumoRepo r) { this.repo = r; }

    @Override public Insumo save(Insumo i) { return repo.save(InsumoDocument.desde(i)).aDominio(); }
    @Override public Optional<Insumo> findById(String id) { return repo.findById(id).map(InsumoDocument::aDominio); }
    @Override public List<Insumo> findAll() { return repo.findAll().stream().map(InsumoDocument::aDominio).toList(); }
}
