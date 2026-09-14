FROM nvidia/cuda:12.6.3-cudnn-runtime-ubuntu24.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY ai/api/requirements.txt /app/requirements.txt
RUN python3 -m pip install --break-system-packages --no-cache-dir -r /app/requirements.txt

COPY ai /app/ai

EXPOSE 8000
CMD ["python3", "-m", "uvicorn", "nashhal_ai.api:app", "--app-dir", "/app/ai/src", "--host", "0.0.0.0", "--port", "8000"]
