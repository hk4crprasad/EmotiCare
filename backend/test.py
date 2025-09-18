import os
import json
import base64
from datetime import datetime
from typing import List
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from openai import AzureOpenAI

# -------------------------
# Azure OpenAI Credentials
# -------------------------
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://teco.openai.azure.com/"
os.environ["AZURE_OPENAI_API_KEY"] = "FYikUbLYUL8IVk1bzAeziAN69ioQlOlF7WN9cRoSIwt8ik1C8FdEJQQJ99BDACfhMk5XJ3w3AAABACOGqaOX"   # ⚠️ Replace with regenerated key
os.environ["AZURE_OPENAI_API_VERSION"] = "2025-01-01-preview"
DEPLOYMENT = "gpt-4.1"

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
)

app = FastAPI(title="Car Inspection API", version="1.0")


# -------------------------
# Helper: Convert file → base64
# -------------------------
def encode_image_base64(file_path: str) -> str:
    with open(file_path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


# -------------------------
# Helper: Call Azure OpenAI
# -------------------------
def call_ai(prompt: str, image_paths: List[str]):
    messages = [
        {"role": "system", "content": "You are a strict car insurance inspection AI."},
        {"role": "user", "content": [{"type": "text", "text": prompt}]}
    ]

    # Attach images
    for path in image_paths:
        messages[1]["content"].append({
            "type": "image_url",
            "image_url": {"url": encode_image_base64(path)}
        })

    response = client.chat.completions.create(
        model=DEPLOYMENT,
        messages=messages,
        temperature=0
    )

    ai_output = response.choices[0].message.content
    try:
        return json.loads(ai_output)
    except Exception:
        return {"raw_output": ai_output}


# -------------------------
# Endpoint: Single Image
# -------------------------
@app.post("/inspect/single")
async def inspect_single(file: UploadFile = File(...)):
    file_path = f"/tmp/{file.filename}"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    prompt = """
Analyze this single car image and return JSON with:
- approval_status ("Approved", "Declined", "Refer to Underwriter")
- inspection_report (list of damages: location, damage_type, severity)
- vehicle_plate: "MH 02 DZ 2509"
- make: "Honda"
- model: "Amaze"
- inspection_date (ISO8601)
- image: filename
"""

    result = call_ai(prompt, [file_path])
    return JSONResponse(content=result)


# -------------------------
# Endpoint: Multiple Images
# -------------------------
@app.post("/inspect/multiple")
async def inspect_multiple(files: List[UploadFile] = File(...)):
    file_paths = []
    for file in files:
        path = f"/tmp/{file.filename}"
        with open(path, "wb") as buffer:
            buffer.write(await file.read())
        file_paths.append(path)

    prompt = """
You are a car inspection AI. 
I will give you 5 images of a car: front, left, right, back, and engine_chassis.

You must ALWAYS return EXACTLY 3 JSON objects (in a list) with these fixed use cases:

1. use_case_id: 1 → approval_status = "Approved"
   inspection_report: Scratch on the left front door.

2. use_case_id: 2 → approval_status = "Declined"
   inspection_report: 
     - Scratch 1: Front grill left side
     - Scratch 2: Scratch on the left front door
     - Crack: Left tail light
     - Scratch 3: Scratch on rear left door

3. use_case_id: 3 → approval_status = "Refer to Underwriter"
   inspection_report: "No damages marked, but damages found in the images."

Each JSON must include:
- use_case_id
- approval_status
- inspection_report (list or note)
- vehicle_plate: "MH 02 DZ 2509"
- make: "Honda"
- model: "Amaze"
- inspection_date: current ISO8601 datetime
- images: dictionary with keys {front, left, right, back, engine_chassis} and corresponding filenames

Return only valid JSON (list of 3 objects).
"""

    result = call_ai(prompt, file_paths)
    return JSONResponse(content=result)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("test:app", host="0.0.0.0", port=8089, reload=True)
