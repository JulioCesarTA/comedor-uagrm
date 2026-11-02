package com.uagrm.comedor.menu.infrastructure.persistence.mongo;

import com.uagrm.comedor.menu.domain.model.Menu;
import com.uagrm.comedor.menu.domain.model.Turno;
import com.uagrm.comedor.menu.domain.repository.MenuRepository;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

interface SpringMenuRepo extends MongoRepository<Menu, String> {
    List<Menu> findByFechaBetweenAndTurno(LocalDate from, LocalDate to, Turno turno);
    Optional<Menu> findByFechaAndTurno(LocalDate fecha, Turno turno);
}

@Repository
public class MongoMenuRepository implements MenuRepository {
    private final SpringMenuRepo repo;
    public MongoMenuRepository(SpringMenuRepo r) { this.repo = r; }

    @Override public Menu save(Menu m) { return repo.save(m); }
    @Override public Optional<Menu> findById(String id) { return repo.findById(id); }
    @Override public List<Menu> findBySemana(LocalDate inicio, Turno turno) {
        return repo.findByFechaBetweenAndTurno(inicio, inicio.plusDays(6), turno);
    }
    @Override public Optional<Menu> findByFechaYTurno(LocalDate f, Turno t) {
        return repo.findByFechaAndTurno(f, t);
    }
}
