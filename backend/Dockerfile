FROM python:3.13-slim

WORKDIR /app

COPY shared/python/glogger/ ./shared/python/glogger/
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

ENV PORT=8080

EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]

