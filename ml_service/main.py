from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# Enable CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
def read_root():
    return {"status": "ML Service is running"}

@app.post("/predict", response_model=PredictionResult)
def predict_requirements(vitals: Vitals):
    """
    Mock XGBoost Prediction Endpoint.
    Normally, here we would load `model = xgb.Booster({'nthread': 4})`, `model.load_model('model.bin')`
    and run predictions based on the input vitals.
    For this prototype, we simulate a rules-based/random outcome reflective of ML classification.
    """
    
    # Simple logic simulation based on vitals mapping to XGBoost trees
    icu_req = 0
    vent_req = 0
    general_req = 1
    specialists = []

    symptoms_lower = vitals.symptoms.lower()

    # Determine severity
    is_critical = False
    if vitals.spo2 < 90 or vitals.systolicBP < 90 or vitals.heartRate > 120 or vitals.heartRate < 50:
        is_critical = True
        icu_req = 1
        general_req = 0
    
    if vitals.spo2 < 85:
        vent_req = 1

    # Text extraction simulation
    if "chest pain" in symptoms_lower or "heart" in symptoms_lower or "cardiac" in symptoms_lower:
        specialists.append("cardiac")
    if "headache" in symptoms_lower or "stroke" in symptoms_lower or "seizure" in symptoms_lower:
        specialists.append("neuro")
        if is_critical:
            icu_req = 1
    if "burn" in symptoms_lower:
        specialists.append("burn")
    if "trauma" in symptoms_lower or "accident" in symptoms_lower or "bleeding" in symptoms_lower:
        specialists.append("trauma")
        specialists.append("ortho")
    
    # Default fallback
    if not specialists:
        specialists.append("general")

    return PredictionResult(
        icuBeds_Required=icu_req,
        ventilators_Required=vent_req,
        generalBeds_Required=general_req,
        specialists_Needed=specialists
    )
