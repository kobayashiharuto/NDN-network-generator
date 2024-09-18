import datetime
import subprocess
import re
import mysql.connector
from mysql.connector import Error
from abc import ABC, abstractmethod
from enum import Enum
import logging
from typing import Optional, Dict, Any

# ロギングの設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

# データベース接続情報（必要に応じて変更してください）
DB_CONFIG = {
    'host': 'mysql',
    'user': 'user',
    'password': 'pass',
    'database': 'ndn_logs'
}

# tshark コマンド（必要に応じてオプションを調整してください）
TSHARK_CMD = [
    "tshark",
    "-X",
    "lua_script:/workspaces/lua/ndn.lua",
    "-V",
    "-w",
    "/workspaces/lua/logX.pcap"
]

# 正規表現パターンを定義（パケット情報を抽出するため）
source_ip_pattern = re.compile(r'Source Address: (\d+\.\d+\.\d+\.\d+)')
destination_ip_pattern = re.compile(r'Destination Address: (\d+\.\d+\.\d+\.\d+)')
name_pattern = re.compile(r'Name: (/.+?)(?:,|\s|$)')
nonce_pattern = re.compile(r'Nonce: (\d+)')
interest_lifetime_pattern = re.compile(r'InterestLifetime: (\d+)')
packet_type_pattern = re.compile(r'Named Data Networking \(NDN\), (Interest|Data)')

# 無視するルーターの名前一覧
ROUTER_NAMES = ["/ndn/waseda/%C1.Router"]

class DatabaseManager:
    """
    データベースへの接続と操作を管理するクラス。
    """
    INSERT_PACKET_LOG_QUERY = """
    INSERT INTO packet_logs (request_id, name, packet_type, source_ip, destination_ip, received_time)
    VALUES (%s, %s, %s, %s, %s, %s)
    """

    def __init__(self, config: Dict[str, str]):
        """
        コンストラクタ。

        Args:
            config (Dict[str, str]): データベース接続情報。
        """
        self.config = config
        self.connection = self._create_connection()
        self._create_tables()

    def _create_connection(self) -> mysql.connector.connection.MySQLConnection:
        """
        データベースへの接続を確立する。

        Returns:
            MySQLConnection: データベース接続オブジェクト。

        Raises:
            Exception: 接続に失敗した場合。
        """
        try:
            connection = mysql.connector.connect(**self.config)
            logging.info("MySQL database connection established.")
            return connection
        except Error as e:
            logging.error(f"Error connecting to MySQL: {e}")
            raise

    def _create_tables(self) -> None:
        """
        必要なテーブルが存在しない場合は作成する。
        """
        create_table_query = """
        CREATE TABLE IF NOT EXISTS packet_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            request_id VARCHAR(255),
            name VARCHAR(1024),
            packet_type INT,
            source_ip VARCHAR(45),
            destination_ip VARCHAR(45),
            received_time DATETIME
        );
        """
        cursor = self.connection.cursor()
        try:
            cursor.execute(create_table_query)
            self.connection.commit()
            logging.info("Table 'packet_logs' is ready.")
        except Error as e:
            logging.error(f"Error creating table: {e}")
            self.connection.rollback()
        finally:
            cursor.close()

    def insert_log(self, log_data: 'LogData') -> None:
        """
        ログデータをデータベースに挿入する。

        Args:
            log_data (LogData): 挿入するログデータ。
        """
        cursor = self.connection.cursor()
        try:
            cursor.execute(self.INSERT_PACKET_LOG_QUERY, log_data.to_tuple())
            self.connection.commit()
            logging.info(f"Packet log inserted: {log_data.to_dict()}")
        except Error as e:
            logging.error(f"Error inserting packet log: {e}")
            self.connection.rollback()
        finally:
            cursor.close()

    def close(self) -> None:
        """
        データベース接続を閉じる。
        """
        if self.connection.is_connected():
            self.connection.close()
            logging.info("MySQL database connection closed.")

class Packet(ABC):
    """
    パケットの抽象基底クラス。
    """
    def __init__(self, source_ip: str, destination_ip: str, name: str):
        """
        コンストラクタ。

        Args:
            source_ip (str): 送信元IPアドレス。
            destination_ip (str): 送信先IPアドレス。
            name (str): パケットのNameフィールド。
        """
        self.source_ip = source_ip
        self.destination_ip = destination_ip
        self.name = name
        self.received_time = datetime.datetime.now()

    @abstractmethod
    def process(self) -> None:
        """
        パケットの処理を行う抽象メソッド。
        """
        pass

class InterestPacket(Packet):
    """
    Interestパケットを表すクラス。
    """
    def __init__(self, source_ip: str, destination_ip: str, name: str, nonce: str):
        """
        コンストラクタ。

        Args:
            source_ip (str): 送信元IPアドレス。
            destination_ip (str): 送信先IPアドレス。
            name (str): パケットのNameフィールド。
            nonce (str): パケットのNonceフィールド。
        """
        super().__init__(source_ip, destination_ip, name)
        self.nonce = nonce

    def process(self) -> None:
        """
        Interestパケットの処理を行う。
        """
        logging.debug(f"Processing InterestPacket: {self.__dict__}")

class DataPacket(Packet):
    """
    Dataパケットを表すクラス。
    """
    def __init__(self, source_ip: str, destination_ip: str, name: str):
        """
        コンストラクタ。

        Args:
            source_ip (str): 送信元IPアドレス。
            destination_ip (str): 送信先IPアドレス。
            name (str): パケットのNameフィールド。
        """
        super().__init__(source_ip, destination_ip, name)

    def process(self) -> None:
        """
        Dataパケットの処理を行う。
        """
        logging.debug(f"Processing DataPacket: {self.__dict__}")

class LogData(ABC):
    """
    ログデータの抽象基底クラス。
    """
    @abstractmethod
    def to_dict(self) -> Dict[str, Any]:
        """
        ログデータを辞書形式に変換する。

        Returns:
            Dict[str, Any]: ログデータの辞書。
        """
        pass

    @abstractmethod
    def to_tuple(self) -> tuple:
        """
        ログデータをタプル形式に変換する（データベース挿入用）。

        Returns:
            tuple: ログデータのタプル。
        """
        pass

class PacketType(Enum):
    """
    パケットの種類を表す列挙型。
    """
    INTEREST = 0
    DATA = 1

class PacketLogData(LogData):
    """
    パケットのログデータクラス。
    """
    def __init__(self, packet: Packet, packet_type: PacketType, request_id: str):
        """
        コンストラクタ。

        Args:
            packet (Packet): ログ化するパケット。
            packet_type (PacketType): パケットの種類。
            request_id (str): パケットのリクエストID（Nonce）。
        """
        self.request_id: str = request_id
        self.name: str = packet.name
        self.packet_type: PacketType = packet_type
        self.source_ip: str = packet.source_ip
        self.destination_ip: str = packet.destination_ip
        self.received_time: datetime.datetime = packet.received_time

    def to_dict(self) -> Dict[str, Any]:
        """
        ログデータを辞書形式に変換する。

        Returns:
            Dict[str, Any]: ログデータの辞書。
        """
        return {
            'request_id': self.request_id,
            'name': self.name,
            'packet_type': self.packet_type.value,
            'source_ip': self.source_ip,
            'destination_ip': self.destination_ip,
            'received_time': self.received_time
        }

    def to_tuple(self) -> tuple:
        """
        ログデータをタプル形式に変換する。

        Returns:
            tuple: ログデータのタプル。
        """
        return (
            self.request_id,
            self.name,
            self.packet_type.value,
            self.source_ip,
            self.destination_ip,
            self.received_time
        )

class PendingInterestPacketInfo:
    """
    対応するInterestパケットの情報を保持するクラス。
    """
    def __init__(self, incoming_packet: InterestPacket, outgoing_packet: InterestPacket):
        """
        コンストラクタ。

        Args:
            incoming_packet (InterestPacket): 受信したInterestパケット。
            outgoing_packet (InterestPacket): 送信したInterestパケット。
        """
        self.destination_ip: str = outgoing_packet.destination_ip
        self.source_ip: str = incoming_packet.source_ip
        self.name: str = outgoing_packet.name
        self.nonce: str = outgoing_packet.nonce

class LogAgent:
    """
    パケットのログを管理するエージェントクラス。
    """
    def __init__(self, db_manager: DatabaseManager):
        """
        コンストラクタ。

        Args:
            db_manager (DatabaseManager): データベースマネージャーのインスタンス。
        """
        self.db_manager = db_manager
        self.pending_interest_packets: Dict[str, InterestPacket] = {}
        self.pending_interest_info: Dict[str, PendingInterestPacketInfo] = {}

    def log_interest(self, packet: InterestPacket) -> None:
        """
        Interestパケットのログ処理を行う。

        Args:
            packet (InterestPacket): 処理するInterestパケット。
        """
        if packet.nonce in self.pending_interest_packets:
            # 対になるInterestパケットが見つかった場合
            incoming_packet = self.pending_interest_packets.pop(packet.nonce)
            self.pending_interest_info[packet.nonce] = PendingInterestPacketInfo(incoming_packet, packet)
            # パケットログをデータベースに挿入
            log_data = PacketLogData(packet, PacketType.INTEREST, packet.nonce)
            self.db_manager.insert_log(log_data)
        else:
            # パケットを待機リストに追加
            self.pending_interest_packets[packet.nonce] = packet

    def log_data(self, packet: DataPacket) -> None:
        """
        Dataパケットのログ処理を行う。

        Args:
            packet (DataPacket): 処理するDataパケット。
        """
        # 対応するInterestパケット情報を検索
        for nonce, info in list(self.pending_interest_info.items()):
            if info.destination_ip == packet.source_ip and info.name == packet.name:
                # パケットログをデータベースに挿入
                log_data = PacketLogData(packet, PacketType.DATA, nonce)
                self.db_manager.insert_log(log_data)
                # 対応済みの情報を削除
                del self.pending_interest_info[nonce]
                break

    def close(self) -> None:
        """
        データベース接続を閉じる。
        """
        self.db_manager.close()

def main() -> None:
    """
    メイン関数。tsharkの出力を解析し、パケット情報をデータベースに保存する。
    """
    db_manager = DatabaseManager(DB_CONFIG)
    log_agent = LogAgent(db_manager)

    try:
        # tsharkコマンドを実行し、パケット情報を取得
        with subprocess.Popen(TSHARK_CMD, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True) as proc:
            # パケット情報の初期化
            source_ip: Optional[str] = None
            destination_ip: Optional[str] = None
            name: Optional[str] = None
            nonce: Optional[str] = None
            packet_type: Optional[str] = None

            for line in proc.stdout:
                # パケットタイプを検出
                packet_type_match = packet_type_pattern.search(line)
                if packet_type_match:
                    packet_type = packet_type_match.group(1)

                # 送信元IPを検出
                source_ip_match = source_ip_pattern.search(line)
                if source_ip_match:
                    source_ip = source_ip_match.group(1)

                # 送信先IPを検出
                destination_ip_match = destination_ip_pattern.search(line)
                if destination_ip_match:
                    destination_ip = destination_ip_match.group(1)

                # Nameフィールドを検出
                name_match = name_pattern.search(line)
                if name_match:
                    name = name_match.group(1)

                # Interestパケットの場合、Nonceを検出
                if packet_type == "Interest":
                    nonce_match = nonce_pattern.search(line)
                    if nonce_match:
                        nonce = nonce_match.group(1)

                # Interestパケットの完全な情報が揃った場合
                if packet_type == "Interest" and all([source_ip, destination_ip, name, nonce]):
                    # 無視するパケットをフィルタリング
                    if "/localhop/ndn/nlsr/sync" in name or "/localhost" in name:
                        continue

                    if any(router_name in name for router_name in ROUTER_NAMES):
                        continue

                    # Interestパケットを処理
                    packet = InterestPacket(source_ip, destination_ip, name, nonce)
                    packet.process()
                    log_agent.log_interest(packet)

                    # 変数をリセット
                    packet_type = source_ip = destination_ip = name = nonce = None

                # Dataパケットの完全な情報が揃った場合
                elif packet_type == "Data" and all([source_ip, destination_ip, name]):
                    # 無視するパケットをフィルタリング
                    if "/localhop/ndn/nlsr/sync" in name or "/localhost" in name:
                        continue

                    if any(router_name in name for router_name in ROUTER_NAMES):
                        continue

                    # Dataパケットを処理
                    packet = DataPacket(source_ip, destination_ip, name)
                    packet.process()
                    log_agent.log_data(packet)

                    # 変数をリセット
                    packet_type = source_ip = destination_ip = name = None

    except KeyboardInterrupt:
        logging.info("Interrupted by user.")
    except Exception as e:
        logging.error(f"An error occurred: {e}")
    finally:
        # リソースを解放
        log_agent.close()

if __name__ == "__main__":
    main()
