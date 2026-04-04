import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.multioutput import MultiOutputClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import json
import os
from datetime import datetime

def generate_synthetic_data(num_samples=2000):
    np.random.seed(42)

    data = []

    for _ in range(num_samples):
        # Generate random vitals based on typical ranges
        heartRate = np.random.randint(40, 160)
        systolicBP = np.random.randint(70, 180)
        diastolicBP = np.random.randint(40, 110)
        spo2 = np.random.randint(80, 100)
        temperature = round(np.random.uniform(97.0, 104.0), 1)

        # Labels
        icuBeds_Required = 0
        ventilators_Required = 0
        generalBeds_Required = 1  # Default

        # Medical Logic implementation (creating ground truth)
        is_critical = False
        
        if spo2 < 90 or systolicBP < 90 or heartRate > 120 or heartRate < 50:
            is_critical = True
            icuBeds_Required = 1
            generalBeds_Required = 0
            
        if spo2 < 85:
            ventilators_Required = 1
            icuBeds_Required = 1
            generalBeds_Required = 0
            
        if temperature > 103:
            is_critical = True
            icuBeds_Required = 1
            generalBeds_Required = 0
            
        row = {
            'heartRate': heartRate,
            'systolicBP': systolicBP,
            'diastolicBP': diastolicBP,
            'spo2': spo2,
            'temperature': temperature,
            'icu': icuBeds_Required,
            'vent': ventilators_Required,
            'general': generalBeds_Required
        }
        data.append(row)
        
    df = pd.DataFrame(data)
    
    # Introduce a bit of noise (optional)
    # This prevents the model from just learning a simple rule 
    noise_idx = np.random.choice(df.index, size=int(num_samples * 0.05), replace=False)
    for idx in noise_idx:
        df.at[idx, 'icu'] = 1 if df.at[idx, 'icu'] == 0 else 0
        
    return df

def train_model():
    print("Generating synthetic data...")
    df = generate_synthetic_data(5000)
    
    features = ['heartRate', 'systolicBP', 'diastolicBP', 'spo2', 'temperature']
    targets = ['icu', 'vent', 'general']
    
    X = df[features]
    y = df[targets]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Multi-Output XGBoost model...")
    base_model = xgb.XGBClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=4,
        random_state=42,
        use_label_encoder=False,
        eval_metric='logloss'
    )
    
    multi_model = MultiOutputClassifier(base_model, n_jobs=-1)
    multi_model.fit(X_train, y_train)
    
    # Evaluate
    print("Evaluating model...")
    y_pred = multi_model.predict(X_test)
    
    per_target_accuracy = {}
    for i, col in enumerate(targets):
        print(f"--- Performance for {col} ---")
        print(classification_report(y_test.iloc[:, i], y_pred[:, i]))
        acc = accuracy_score(y_test.iloc[:, i], y_pred[:, i])
        per_target_accuracy[col] = round(acc, 4)
        print(f"Accuracy ({col}): {acc:.4f}")

    overall_accuracy = round(sum(per_target_accuracy.values()) / len(per_target_accuracy), 4)
    print(f"\nOverall mean accuracy: {overall_accuracy:.4f}")

    # Save metrics.json
    metrics = {
        "model": "MultiOutputXGBoost",
        "overall_accuracy": overall_accuracy,
        "per_target_accuracy": per_target_accuracy,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    metrics_path = os.path.join(os.path.dirname(__file__), 'metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to {metrics_path}")

    # Save the model
    print("Saving model to model.pkl...")
    joblib.dump(multi_model, 'model.pkl')
    print("Done!")

if __name__ == '__main__':
    train_model()
