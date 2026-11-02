package com.uagrm.comedor.menu.infrastructure.persistence.mongo;

import com.uagrm.comedor.menu.domain.model.FichaNutricional;
import com.uagrm.comedor.menu.domain.model.Receta;
import com.uagrm.comedor.menu.domain.repository.RecetaRepository;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Document("recetas")
class RecetaDoc {
    @Id String id;
    String nombre;
    List<IngDoc> ingredientes;
    List<String> pasos;
    FichaNutricional ficha;

    static class IngDoc {
        String insumoId;
        double cantidadValor;
        String cantidadUnidad;
    }

    static RecetaDoc from(Receta r) {
        RecetaDoc d = new RecetaDoc();
        d.id = r.id(); d.nombre = r.nombre(); d.pasos = r.pasos(); d.ficha = r.ficha();
        d.ingredientes = r.ingredientes().stream().map(i -> {
            IngDoc x = new IngDoc();
            x.insumoId = i.insumoId();
            x.cantidadValor = i.cantidad().valor();
            x.cantidadUnidad = i.cantidad().unidad();
            return x;
        }).collect(Collectors.toList());
        return d;
    }
    Receta toDomain() {
        var ings = ingredientes.stream().map(i -> new Receta.Ingrediente(i.insumoId,
            new com.uagrm.comedor.menu.domain.model.Cantidad(i.cantidadValor, i.cantidadUnidad))).toList();
        return new Receta(id, nombre, ings, pasos, ficha);
    }
}

interface SpringRecetaRepo extends MongoRepository<RecetaDoc, String> {}

@Repository
public class MongoRecetaRepository implements RecetaRepository {
    private final SpringRecetaRepo repo;
    public MongoRecetaRepository(SpringRecetaRepo r) { this.repo = r; }

    @Override public Receta save(Receta r) { return repo.save(RecetaDoc.from(r)).toDomain(); }
    @Override public Optional<Receta> findById(String id) { return repo.findById(id).map(RecetaDoc::toDomain); }
    @Override public List<Receta> findAll() { return repo.findAll().stream().map(RecetaDoc::toDomain).toList(); }
}
