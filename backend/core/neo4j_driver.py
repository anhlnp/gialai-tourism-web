"""
Neo4j Driver — Kết nối Neo4j Aura Cloud (Singleton).
"""
from contextlib import contextmanager
from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

load_dotenv()

_URI = os.getenv("NEO4J_URI", "neo4j+ssc://localhost:7687")
_USER = os.getenv("NEO4J_USERNAME", "neo4j")
_PASS = os.getenv("NEO4J_PASSWORD", "")
_DB = os.getenv("NEO4J_DATABASE", "neo4j")

_driver = None


def get_driver():
    global _driver
    if _driver is None:
        _driver = GraphDatabase.driver(_URI, auth=(_USER, _PASS))
        _driver.verify_connectivity()
    return _driver


def run_query(cypher: str, params: dict | None = None) -> list[dict]:
    driver = get_driver()
    with driver.session(database=_DB) as session:
        result = session.run(cypher, params or {})
        return [record.data() for record in result]


def run_query_single(cypher: str, params: dict | None = None) -> dict | None:
    driver = get_driver()
    with driver.session(database=_DB) as session:
        result = session.run(cypher, params or {})
        record = result.single()
        return record.data() if record else None
