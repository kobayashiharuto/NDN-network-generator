from flask import Flask, jsonify, request

app = Flask(__name__)

# 固定ノードデータ
NODES = [
    {"id": "A", "title": "Server", "mainStats": "150.1ms", "subTitle": "150.1ms", "icon": "user", "color": "green"},
    {"id": "B", "title": "Server B", "mainStats": "150.1ms", "subTitle": "150.1ms", "icon": "expand-arrows-alt", "color": "#4169e1"},
    {"id": "C", "title": "Server C", "mainStats": "150.1ms", "subTitle": "150.1ms", "icon": "brackets-curly", "color": "#F24F4FFF"},
    {"id": "D", "title": "Server D", "mainStats": "150.1ms", "subTitle": "150.1ms", "icon": "database", "color": "orange"}
]

# 固定エッジデータ
EDGES = [
    {"id": "1", "source": "A", "target": "B", "mainStat": "30mb/s"},
    {"id": "2", "source": "A", "target": "C", "mainStat": "20mb/s"},
    {"id": "3", "source": "B", "target": "D", "mainStat": "24.2mb/s"}
]

@app.route("/nodes", methods=["GET"])
def get_nodes():
    request_id = request.args.get("request_id")
    # trace ID が取れているか判断するため、title を変更 (request_id + title)
    NODES[0]["title"] = f"Server A ({request_id})"
    return jsonify(NODES)

@app.route("/edges", methods=["GET"])
def get_edges():
    request_id = request.args.get("request_id")
    # Trace IDは今回は固定データを返すだけなので無視
    return jsonify(EDGES)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
