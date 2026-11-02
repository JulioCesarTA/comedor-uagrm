package com.uagrm.comedor.menu.domain.model;

public record FichaNutricional(int kcal, double proteinasG, double carbosG, double grasasG) {
    public FichaNutricional {
        if (kcal < 0 || proteinasG < 0 || carbosG < 0 || grasasG < 0)
            throw new IllegalArgumentException("Valores nutricionales negativos no válidos");
    }
}
