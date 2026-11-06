# HTTP endpoints and request validation
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Literal

from inference import generate_response

app = FastAPI(
    title="Baymax - Your personal medical assistant",
    version="0.1.0"
)

# request validation
class Prompt(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=2000
    )

# response validation
class Response(BaseModel):
    message: str
    model: str
    status: Literal["completed"]

# check whether AI service is running
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ai inference"
    }

# takes user prompt and generate a response
@app.post("/generate", response_model=Response)
def generate(prompt: Prompt) -> str:
    response = generate_response(prompt.message)

    return Response(
        message=response,
        model="mock",
        status="completed"
    )

