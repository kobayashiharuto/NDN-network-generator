# NDN Network Generator (NDN-FCW+ と分散トレーシング実装版)

NDN Network を CSV に設定を書くだけで自動的に構築します。

ノードの設定、NLSR の設定、face を貼るところまで全て自動で行います。

この実装では NDN-FCW+ の実装がサンプルに配置されており、さらにトレーシングの仕組みも導入されています。

## 0. 依存関係のインストール

```
pip install -r requirements.txt
```

## 使い方

1. `config/network_relations.csv` にネットワークのつながりを記述
1. `config/node_info.csv` にそれぞれのノード起動時のコマンドを記述
1. 起動
1. それぞれのコンテナに入る
1. consumer でリクエストする
1. 分散トレーシングのログを可視化する

### 1. `config/network_relations.csv` にネットワークのつながりを記述

`network_relations.csv` にはノード間のつながりを記述します。

```csv
node1,node2
router1,router2
router2,router3
producer1,router1
consumer,router3
```

一番最初の node1,node2 はヘッダーです。

上記の記述であれば、`router1 と router2`, `router2 と router3`, `producer1 と router1`, `consumer と router3` が相互につながったネットワークという意味になります。

![Network Graph](network.svg)


### 2. `config/node_info.csv` にそれぞれのノード起動時のコマンドを記述

次に、`node_info.csv` にそれぞれのノードで実行するコマンドを書いていきます。

```csv
node_name,command
router1,""
router2,""
producer1,"python3 ./ndn_clients/producer.py /producer1"
function1,"python3 ./ndn_clients/function.py /function1"
consumer,""
```

特に実行しない場合は空文字列を入れます。

また、`ndn_clients/` にサンプル的に動かせる producer や function のプログラムがあります。

### 3. 起動

以下で起動します。これにより、自動的に全てのノードが生成され、設定を元にNLSRの設定がされ、faceが貼られ、設定した起動時コマンドが実行されます。

```shell
python src/main.py
```

### 4. それぞれのコンテナに入る

`docker-compose.yml` は `generated/` の中に自動的に生成されています。

このディレクトリに移動すれば `docker compose` 系のコマンドを使うことができます。

以下のようにコンテナに入れます。(ノード名が `producer` のコンテナに入りたい場合。指定したノード名とコンテナ名は対応しています。)

```shell
docker compose exec consumer bash
```

### 5. consumer でリクエストする

consumer の中で以下のようにリクエスト

```shell
python3 ./ndn_clients/consumer.py
```

### 6. 分散トレーシングのログを可視化する

ログ用の mysql コンテナは自動で立っていますので入ってログを可視化できます。

```shell
docker compose exec mysql bash
```

以下のようにログを取得できます。

```
root@4f5b62f8b7fd:/workspaces# python3 visualization/main.py 
トレースを開始するリクエストID（nonce）を入力してください: 3501592025
リクエストチェーン:
3501592025 --> 3261777629
3501592025 --> 2942250589

Mermaid シーケンス図:
sequenceDiagram
participant Consumer
participant Router (172.23.0.5)
participant Router (172.23.0.6)
participant Service
participant Producer
Consumer ->> Router (172.23.0.5): Interest /function1/xxaaa/(/producer1/aaa, /producer1/bbb) [3501592025] (+N/A)
Router (172.23.0.5) ->> Router (172.23.0.6): Interest /function1/xxaaa/(/producer1/aaa, /producer1/bbb) [3501592025] (+0.02 ms)
Router (172.23.0.6) ->> Service: Interest /function1/xxaaa/(/producer1/aaa, /producer1/bbb) [3501592025] (+0.20 ms)
Service ->> Router (172.23.0.6): Interest /producer1/aaa [3261777629] (+10.93 ms)
Router (172.23.0.6) ->> Router (172.23.0.5): Interest /producer1/aaa [3261777629] (+0.00 ms)
Router (172.23.0.5) ->> Producer: Interest /producer1/aaa [3261777629] (+0.07 ms)
Service ->> Router (172.23.0.6): Interest /producer1/bbb [2942250589] (+3.49 ms)
Router (172.23.0.6) ->> Router (172.23.0.5): Interest /producer1/bbb [2942250589] (+0.01 ms)
Router (172.23.0.5) ->> Producer: Interest /producer1/bbb [2942250589] (+0.20 ms)
Producer ->> Router (172.23.0.5): Data /producer1/aaa [3261777629] (+19.15 ms)
Router (172.23.0.5) ->> Router (172.23.0.6): Data /producer1/aaa [3261777629] (+0.00 ms)
Router (172.23.0.6) ->> Service: Data /producer1/aaa [3261777629] (+0.07 ms)
Producer ->> Router (172.23.0.5): Data /producer1/bbb [2942250589] (+41.41 ms)
Router (172.23.0.5) ->> Router (172.23.0.6): Data /producer1/bbb [2942250589] (+0.00 ms)
Router (172.23.0.6) ->> Service: Data /producer1/bbb [2942250589] (+0.09 ms)
Service ->> Router (172.23.0.6): Data /function1/xxaaa/(/producer1/aaa, /producer1/bbb) [3501592025] (+20.20 ms)
Router (172.23.0.6) ->> Router (172.23.0.5): Data /function1/xxaaa/(/producer1/aaa, /producer1/bbb) [3501592025] (+0.00 ms)
Router (172.23.0.5) ->> Consumer: Data /function1/xxaaa/(/producer1/aaa, /producer1/bbb) [3501592025] (+0.06 ms)
```