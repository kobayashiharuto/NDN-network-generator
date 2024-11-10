from time import sleep
from lib.ndn_producer import NDNProducer
import sys

def on_interest(name: str) -> str:
    print(f"Interest: {name}")
    # name のスラッシュをスペースにして返すだけの関数に
    return name[1:].replace("/", " ")

if __name__ == '__main__':
    producer = NDNProducer()
    # ここで引数からprefixを取得する
    if len(sys.argv) < 2:
        print("Usage: python producer.py <prefix>")
        sys.exit(1)
    prefix = sys.argv[1]
    producer.run(prefix, on_interest)