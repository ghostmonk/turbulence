FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8080

EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]

