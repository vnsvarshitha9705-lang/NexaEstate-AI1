
import pandas as pd
import numpy as np
import joblib

from india_housing_datasets import load_housing

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# 1. Load data from all four cities
cities = ["hyderabad", "bangalore", "chennai", "mumbai"]

dataframes = []

for city in cities:
    df = load_housing(city)
    dataframes.append(df)

# 2. Combine all city datasets
data = pd.concat(dataframes, ignore_index=True)

# 3. Remove missing values and duplicate records
data = data.dropna()
data = data.drop_duplicates()

# Remove invalid house records
data = data[data["price_lakhs"] > 0]
data = data[data["area_sqft"] > 0]

print("Dataset loaded successfully!")
print("Total records:", len(data))
print(data.head())

# 4. Select input features
features = [
    "city",
    "locality",
    "area_sqft",
    "bhk",
    "bath",
    "floor",
    "age_years"
]

X = data[features]

# 5. Select target column
y = data["price_lakhs"]

# 6. Identify text and numerical columns
categorical_features = ["city", "locality"]

numerical_features = [
    "area_sqft",
    "bhk",
    "bath",
    "floor",
    "age_years"
]

# 7. Convert text columns into numerical features
preprocessor = ColumnTransformer(
    transformers=[
        (
            "categories",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features
        )
    ],
    remainder="passthrough"
)

# 8. Create Random Forest model
model = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        (
            "regressor",
            RandomForestRegressor(
                n_estimators=300,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        )
    ]
)

# 9. Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

# 10. Train the model
print("\nTraining Random Forest model...")

model.fit(X_train, y_train)

# 11. Make predictions
predictions = model.predict(X_test)

# 12. Evaluate the model
mae = mean_absolute_error(y_test, predictions)

rmse = np.sqrt(
    mean_squared_error(y_test, predictions)
)

r2 = r2_score(y_test, predictions)

print("\nMODEL EVALUATION")
print("------------------------")
print("MAE:", round(mae, 2), "lakhs")
print("RMSE:", round(rmse, 2), "lakhs")
print("R2 Score:", round(r2, 3))

# 13. Save the trained model
joblib.dump(model, "house_price_model.pkl")

print("\nModel saved successfully!")
