import mysql.connector
from mysql.connector import Error
import datetime
from collections import defaultdict, Counter

# データベース接続情報
DB_CONFIG = {
    'host': 'mysql',
    'user': 'user',
    'password': 'pass',
    'database': 'ndn_logs'
}

def connect_db():
    """データベース接続を確立する"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"データベース接続エラー: {e}")
        exit(1)

def get_related_nonces(connection, parent_nonce, chain_dict, visited):
    """
    request_chainテーブルから関連するnonceを再帰的に取得する。
    """
    if parent_nonce in visited:
        return
    visited.add(parent_nonce)

    cursor = connection.cursor()
    query = "SELECT child_nonce FROM request_chain WHERE parent_nonce = %s"
    cursor.execute(query, (parent_nonce,))
    child_nonces = cursor.fetchall()

    for (child_nonce,) in child_nonces:
        chain_dict.setdefault(parent_nonce, []).append(child_nonce)
        get_related_nonces(connection, child_nonce, chain_dict, visited)

    cursor.close()

def get_packet_logs(connection, nonces):
    """指定されたnonceのパケットログを取得する。"""
    cursor = connection.cursor(dictionary=True)
    format_strings = ','.join(['%s'] * len(nonces))
    query = f"""
        SELECT * FROM packet_logs
        WHERE request_id IN ({format_strings})
        ORDER BY received_time
    """
    cursor.execute(query, tuple(nonces))
    logs = cursor.fetchall()
    cursor.close()
    return logs

def deduce_roles(logs):
    """
    パケットログを分析して各IPアドレスの役割を推測する。
    """
    roles = {}
    ip_stats = {}

    for log in logs:
        packet_type = log['packet_type']
        source_ip = log['source_ip']
        destination_ip = log['destination_ip']

        # IPの統計情報を初期化
        for ip in [source_ip, destination_ip]:
            if ip and ip not in ip_stats:
                ip_stats[ip] = {
                    'interest_sent': 0,
                    'interest_received': 0,
                    'data_sent': 0,
                    'data_received': 0,
                    'interest_names_sent': set(),
                    'interest_names_received': set(),
                    'data_names_sent': set(),
                    'data_names_received': set(),
                }

        # パケットタイプに基づいて統計情報を更新
        if packet_type == 0:  # Interestパケット
            if source_ip:
                ip_stats[source_ip]['interest_sent'] += 1
                ip_stats[source_ip]['interest_names_sent'].add(log['name'])
            if destination_ip:
                ip_stats[destination_ip]['interest_received'] += 1
                ip_stats[destination_ip]['interest_names_received'].add(log['name'])
        elif packet_type == 1:  # Dataパケット
            if source_ip:
                ip_stats[source_ip]['data_sent'] += 1
                ip_stats[source_ip]['data_names_sent'].add(log['name'])
            if destination_ip:
                ip_stats[destination_ip]['data_received'] += 1
                ip_stats[destination_ip]['data_names_received'].add(log['name'])

    # 役割を推測
    for ip, stats in ip_stats.items():
        # カウント
        interest_sent = stats['interest_sent']
        interest_received = stats['interest_received']
        data_sent = stats['data_sent']
        data_received = stats['data_received']

        # 名前
        interest_names_sent = stats['interest_names_sent']
        interest_names_received = stats['interest_names_received']
        data_names_sent = stats['data_names_sent']
        data_names_received = stats['data_names_received']

        # 役割の初期化
        role = None

        # Consumerのチェック
        if interest_sent > 0 and data_received > 0 \
                and interest_received == 0 and data_sent == 0:
            role = 'Consumer'

        # Producerのチェック
        elif interest_received > 0 and data_sent > 0 \
                and interest_sent == 0 and data_received == 0:
            role = 'Producer'

        # Serviceのチェック
        elif interest_received > 0 and interest_sent > 0:
            # 送信したInterest名が受信したInterest名の部分集合でない場合はService
            if not interest_names_sent.issubset(interest_names_received):
                role = 'Service'
            else:
                role = 'Router'

        # Routerのチェック
        elif interest_received > 0 and interest_sent > 0 and data_received > 0 and data_sent > 0:
            if interest_names_sent == interest_names_received and data_names_sent == data_names_received:
                role = 'Router'
            else:
                role = 'Unknown'
        else:
            role = 'Unknown'

        roles[ip] = role

    return roles

def map_node_ip_to_roles(logs, roles):
    """
    logs内のnode_ipを、対応するsource_ipとdestination_ipの役割に基づいて役割にマッピングする。
    """
    node_roles = {}

    for log in logs:
        node_ip = log['node_ip']
        source_ip = log['source_ip']
        destination_ip = log['destination_ip']

        if node_ip not in node_roles:
            node_roles[node_ip] = []

        if node_ip == source_ip and source_ip in roles:
            node_roles[node_ip].append(roles[source_ip])
        if node_ip == destination_ip and destination_ip in roles:
            node_roles[node_ip].append(roles[destination_ip])

    final_node_roles = {}
    for node_ip, role_list in node_roles.items():
        if role_list:
            role_counter = Counter(role_list)
            most_common_role = role_counter.most_common(1)[0][0]
            final_node_roles[node_ip] = most_common_role
        else:
            final_node_roles[node_ip] = 'Unknown'

    return final_node_roles

def generate_mermaid_sequence_diagram(logs, roles, node_roles):
    """パケットログからMermaidのシーケンス図を生成する。"""
    entities = set()
    messages = []

    # ノードの識別子を作成（役割とIPアドレスの併記）
    node_identifiers = {}
    for node_ip in node_roles:
        role = node_roles.get(node_ip, 'Unknown')
        identifier = f"{role} ({node_ip})"
        node_identifiers[node_ip] = identifier

    # パケットログをreceived_timeでソート
    logs_sorted = sorted(logs, key=lambda x: x['received_time'])

    previous_received_time = None

    class MessageLog:
        def __init__(self, packet_type_str, name, request_id, elapsed_time):
            self.packet_type_str = packet_type_str
            self.name = name
            self.request_id = request_id
            self.elapsed_time = elapsed_time

        def label(self):
            if self.elapsed_time is None:
                return f"{self.packet_type_str} {self.name} [{self.request_id}] (+N/A)"
            elapsed_str = f"{self.elapsed_time:.2f} ms"
            return f"{self.packet_type_str} {self.name} [{self.request_id}] (+{elapsed_str})"

    prev_source = None
    prev_dest = None
    for idx, log in enumerate(logs_sorted):
        packet_type = log['packet_type']
        request_id = log['request_id']
        name = log['name']
        source_ip = log['source_ip']
        destination_ip = log['destination_ip']

        packet_type_str = 'Interest' if packet_type == 0 else 'Data'

        sender_ip = source_ip
        receiver_ip = destination_ip

        sender = node_identifiers.get(sender_ip, roles.get(sender_ip, sender_ip))
        receiver = node_identifiers.get(receiver_ip, roles.get(receiver_ip, receiver_ip))

        # 経過時間の計算
        current_received_time = log['received_time']
        if previous_received_time:
            elapsed_time = (current_received_time - previous_received_time).total_seconds() * 1000  # ミリ秒単位
        else:
            elapsed_time = None

        previous_received_time = current_received_time

        # もし同じ送信元と宛先であれば、これは outcoming も incoming も記録している結果である。例えば router1 -> router2 のログが router1 の outcoming と router2 の incoming として被っていることになる。
        # なので、この場合一つ前のメッセージの経過時間を更新する。
        if destination_ip == prev_dest and source_ip == prev_source:
            entities.update([sender, receiver])
            messages[-1][2].elapsed_time = elapsed_time
            continue

        message_log = MessageLog(packet_type_str, name, request_id, elapsed_time)

        entities.update([sender, receiver])
        messages.append((sender, receiver, message_log))

        prev_source = source_ip
        prev_dest = destination_ip

    # Mermaid図の構築
    diagram = ['sequenceDiagram']
    for entity in entities:
        diagram.append(f"participant {entity}")

    for source, dest, message in messages:
        diagram.append(f"{source} ->> {dest}: {message.label()}")


    return '\n'.join(diagram)

def build_flow(chain_dict, parent_nonce, depth=0):
    """リクエストチェーンの構造を再帰的に構築する。"""
    lines = []
    indent = '  ' * depth
    children = chain_dict.get(parent_nonce, [])
    for child in children:
        lines.append(f"{indent}{parent_nonce} --> {child}")
        lines.extend(build_flow(chain_dict, child, depth+1))
    return lines

def main():
    # トレースを開始するリクエストID（nonce）を入力
    root_nonce = input("トレースを開始するリクエストID（nonce）を入力してください: ")

    # ステップ1: データベースに接続
    connection = connect_db()

    # ステップ2: 関連するnonceを取得
    chain_dict = {}
    visited = set()
    get_related_nonces(connection, root_nonce, chain_dict, visited)
    all_nonces = visited.union(set(chain_dict.keys()))

    # ステップ3: 関連するnonceのパケットログを取得
    logs = get_packet_logs(connection, list(all_nonces))

    # ステップ4: パケットログに基づいて役割を推測
    roles = deduce_roles(logs)

    # node_ipを役割にマッピング
    node_roles = map_node_ip_to_roles(logs, roles)

    # データベース接続を閉じる
    connection.close()

    # ステップ5: リクエストチェーンを構築（オプション）
    flow_lines = build_flow(chain_dict, root_nonce)
    print("リクエストチェーン:")
    print('\n'.join(flow_lines))

    # ステップ6: Mermaidシーケンス図を生成
    mermaid_diagram = generate_mermaid_sequence_diagram(logs, roles, node_roles)
    print("\nMermaid シーケンス図:")
    print(mermaid_diagram)

if __name__ == "__main__":
    main()