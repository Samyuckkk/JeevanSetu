from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
if os.path.exists(model_path):
    multi_model = joblib.load(model_path)
    print(f"[ML] Model loaded from {model_path}")
else:
    multi_model = None
    print("[ML] Warning: model.pkl not found. Predictions will fallback to default zeroes.")

class Vitals(BaseModel):
    heartRate: int
    systolicBP: int
    diastolicBP: int
    spo2: int
    temperature: float
    symptoms: str

class PredictionResult(BaseModel):
    icuBeds_Required: int
    ventilators_Required: int
    generalBeds_Required: int
    specialists_Needed: list[str]

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": multi_model is not None}

@app.get("/")
def read_root():
    return {"status": "ML Service is running", "model_loaded": multi_model is not None}

@app.post("/predict", response_model=PredictionResult)
def predict_requirements(vitals: Vitals):
    print(f"[ML /predict] Input received: {vitals.dict()}")

    icu_req = 0
    vent_req = 0
    general_req = 1

    if multi_model is not None:
        features = pd.DataFrame([{
            'heartRate': vitals.heartRate,
            'systolicBP': vitals.systolicBP,
            'diastolicBP': vitals.diastolicBP,
            'spo2': vitals.spo2,
            'temperature': vitals.temperature
        }])
        preds = multi_model.predict(features)[0]
        icu_req = int(preds[0])
        vent_req = int(preds[1])
        general_req = int(preds[2])

    specialists = []
    symptoms_lower = vitals.symptoms.lower()

    is_critical = (
        vitals.spo2 < 90 or
        vitals.systolicBP < 90 or
        vitals.heartRate > 120 or
        vitals.heartRate < 50
    )

    if "chest pain" in symptoms_lower or "heart" in symptoms_lower or "cardiac" in symptoms_lower:
        specialists.append("cardiac")
    if "headache" in symptoms_lower or "stroke" in symptoms_lower or "seizure" in symptoms_lower:
        specialists.append("neuro")
        if is_critical and icu_req == 0:
            icu_req = 1
    if "burn" in symptoms_lower:
        specialists.append("burn")
    if "trauma" in symptoms_lower or "accident" in symptoms_lower or "bleeding" in symptoms_lower:
        specialists.append("trauma")
        specialists.append("ortho")

    if not specialists:
        specialists.append("general")

    if vent_req == 1 and icu_req == 0:
        icu_req = 1
    if icu_req == 1:
        general_req = 0

    result = PredictionResult(
        icuBeds_Required=icu_req,
        ventilators_Required=vent_req,
        generalBeds_Required=general_req,
        specialists_Needed=specialists
    )
    print(f"[ML /predict] Output: {result.dict()}")
    return result

@app.get("/metrics")
def get_metrics():
    metrics_path = os.path.join(os.path.dirname(__file__), 'metrics.json')
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=404, detail="metrics.json not found. Run train.py first.")
    with open(metrics_path, 'r') as f:
        return json.load(f)
