import psycopg2
import os

def get_db():
    conn = psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        host="/cloudsql/" + os.getenv("CLOUD_SQL_CONNECTION_NAME")
    )
    return conn