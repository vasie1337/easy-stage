FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY stagemarkt.py .

# Force unbuffered output
ENV PYTHONUNBUFFERED=1

CMD ["python", "stagemarkt.py"]
