"""Minimal self-hosted instruction-model gateway.

Set MODEL_ID to a compatible Hugging Face model ID and optionally use
HF_TOKEN for gated/private models. The gateway accepts source context from
Nashhal's API and returns a grounded Arabic answer.
"""
from __future__ import annotations

import os
from typing import Any

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_ID = os.getenv("MODEL_ID", "Qwen/Qwen3-8B")
MAX_NEW_TOKENS = int(os.getenv("MAX_NEW_TOKENS", "700"))

_tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, token=os.getenv("HF_TOKEN") or None)
_model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    token=os.getenv("HF_TOKEN") or None,
    torch_dtype="auto",
    device_map="auto",
)
_model.eval()


def generate_answer(question: str, sources: list[dict[str, Any]]) -> str:
    context = "\n\n".join(
        f"[المصدر {i + 1}] {s.get('title', '')}\n{s.get('text', '')[:5000]}\nالرابط: {s.get('url', '')}"
        for i, s in enumerate(sources)
    )
    prompt = (
        "أنت Nashhal AI، مساعد أخبار عربي يعمل وفق مبدأ الدليل أولًا.\n"
        "قواعدك: لا تخترع الوقائع. استخدم فقط المعلومات الموجودة في المصادر. "
        "ميّز بين الحقيقة والاستنتاج. عند غياب دليل كافٍ، قل بوضوح إن المعلومات غير كافية. "
        "عند استخدام معلومة من مصدر، أشر إلى [المصدر رقم].\n\n"
        f"المصادر:\n{context or 'لا توجد مصادر مسترجعة.'}\n\n"
        f"السؤال: {question}\n\nالإجابة بالعربية:"
    )
    inputs = _tokenizer(prompt, return_tensors="pt").to(_model.device)
    with torch.inference_mode():
        output = _model.generate(**inputs, max_new_tokens=MAX_NEW_TOKENS, do_sample=False)
    generated = output[0][inputs["input_ids"].shape[1]:]
    return _tokenizer.decode(generated, skip_special_tokens=True).strip()


if __name__ == "__main__":
    from fastapi import FastAPI
    from pydantic import BaseModel, Field
    import uvicorn

    app = FastAPI(title="Nashhal AI Model Gateway", version="0.1.0")

    class Request(BaseModel):
        question: str = Field(min_length=1, max_length=4000)
        sources: list[dict[str, Any]] = []

    @app.post("/generate")
    def generate(body: Request) -> dict[str, str]:
        return {"answer": generate_answer(body.question, body.sources)}

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8001")))
