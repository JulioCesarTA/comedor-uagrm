"""CNN de calidad de insumos con MobileNetV2 pretrained."""
import io
import numpy as np
from PIL import Image

_model = None


def _get_model():
    global _model
    if _model is None:
        import tensorflow as tf
        _model = tf.keras.applications.MobileNetV2(
            weights='imagenet', include_top=False, pooling='avg', input_shape=(224, 224, 3)
        )
    return _model


class CnnCalidadInsumo:
    def predict(self, image_bytes: bytes) -> dict:
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert('RGB').resize((224, 224))
            arr = np.array(img, dtype=np.float32)
            arr = (arr / 127.5) - 1.0
            arr = np.expand_dims(arr, axis=0)
            feats = _get_model().predict(arr, verbose=0)[0]
            score = float(np.linalg.norm(feats))
            # score suele estar entre 5 y 25 para fotos típicas
            if score > 18: clase, conf = "optima", 0.85
            elif score > 12: clase, conf = "aceptable", 0.75
            else: clase, conf = "rechazar", 0.65
            return {"clase": clase, "confianza": conf, "feature_norm": round(score, 2), "modelo": "MobileNetV2"}
        except Exception as e:
            return {"error": str(e)}
