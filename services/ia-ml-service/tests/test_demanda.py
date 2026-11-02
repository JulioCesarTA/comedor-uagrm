from app.services.predictor_demanda import predecir_demanda


def test_demanda_devuelve_entero_positivo():
    v = predecir_demanda({"plato_id": "pl-1", "es_feriado": False})
    assert isinstance(v, int) and v > 0


def test_feriado_eleva_la_prediccion():
    base = predecir_demanda({"plato_id": "pl-1", "es_feriado": False})
    fer = predecir_demanda({"plato_id": "pl-1", "es_feriado": True})
    assert fer >= base
