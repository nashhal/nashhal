FROM python:3.12-slim
WORKDIR /app
COPY ai/api/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY ai /app/ai
EXPOSE 8000
CMD ["uvicorn","nashhal_ai.api:app","--app-dir","/app/ai/src","--host","0.0.0.0","--port","8000"]
