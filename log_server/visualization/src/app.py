from flask import Flask, jsonify, request
from database import connect_db
from utils import get_related_nonces, get_packet_logs, deduce_roles, generate_nodes, generate_edges

app = Flask(__name__)

@app.route("/nodes", methods=["GET"])
def get_nodes():
    request_id = request.args.get("request_id")
    if not request_id:
        return jsonify({"error": "request_id is required"}), 400

    connection = connect_db()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500

    chain_dict = {}
    visited = set()
    get_related_nonces(connection, request_id, chain_dict, visited)
    all_nonces = visited.union(set(chain_dict.keys()))

    logs = get_packet_logs(connection, list(all_nonces))
    roles = deduce_roles(logs)
    nodes = generate_nodes(roles)

    connection.close()
    return jsonify(nodes)

@app.route("/edges", methods=["GET"])
def get_edges():
    request_id = request.args.get("request_id")
    if not request_id:
        return jsonify({"error": "request_id is required"}), 400

    connection = connect_db()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500

    chain_dict = {}
    visited = set()
    get_related_nonces(connection, request_id, chain_dict, visited)
    all_nonces = visited.union(set(chain_dict.keys()))

    logs = get_packet_logs(connection, list(all_nonces))
    edges = generate_edges(logs)

    connection.close()
    return jsonify(edges)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
