def get_related_nonces(connection, parent_nonce, chain_dict, visited):
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
                }

        # 統計情報の更新
        if packet_type == 0:  # Interestパケット
            if source_ip:
                ip_stats[source_ip]['interest_sent'] += 1
            if destination_ip:
                ip_stats[destination_ip]['interest_received'] += 1
        elif packet_type == 1:  # Dataパケット
            if source_ip:
                ip_stats[source_ip]['data_sent'] += 1
            if destination_ip:
                ip_stats[destination_ip]['data_received'] += 1

    # 役割の推測
    for ip, stats in ip_stats.items():
        interest_sent = stats['interest_sent']
        interest_received = stats['interest_received']
        data_sent = stats['data_sent']
        data_received = stats['data_received']

        if interest_sent > 0 and data_received > 0 and interest_received == 0 and data_sent == 0:
            role = 'Consumer'
        elif interest_received > 0 and data_sent > 0 and interest_sent == 0 and data_received == 0:
            role = 'Producer'
        elif interest_received > 0 and interest_sent > 0:
            role = 'Service'
        elif interest_received > 0 and data_sent > 0 and interest_sent > 0 and data_received > 0:
            role = 'Router'
        else:
            role = 'Unknown'

        roles[ip] = role

    return roles
def generate_nodes(roles):
    NODES = []
    color_map = {
        'Consumer': 'green',
        'Producer': 'orange',
        'Service': '#F24F4FFF',
        'Router': '#4169e1',
        'Unknown': 'gray'
    }
    icon_map = {
        'Consumer': 'user',
        'Producer': 'database',
        'Service': 'brackets-curly',
        'Router': 'exchange-alt',
        'Unknown': 'question'
    }

    for ip, role in roles.items():
        node = {
            "id": ip,
            "title": f"{role} ({ip})",
            "mainStats": role,
            "subTitle": ip,
            "icon": icon_map.get(role, 'question'),
            "color": color_map.get(role, 'gray')
        }
        NODES.append(node)

    return NODES


def generate_edges(logs):
    EDGES = []
    for idx, log in enumerate(logs):
        source_ip = log['source_ip']
        destination_ip = log['destination_ip']
        packet_type = log['packet_type']
        request_id = log['request_id']

        if source_ip and destination_ip:
            edge = {
                "id": f"{idx}",
                "source": source_ip,
                "target": destination_ip,
                "mainStat": f"Nonce: {request_id}",
                "secondaryStat": "Interest" if packet_type == 0 else "Data"
            }
            EDGES.append(edge)

    return EDGES
