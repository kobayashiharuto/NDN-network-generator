config/functions 配下の、functionノード自体の名前と対応するファイルの exec を呼び出す
(k8sでconfigごとマウントして、そのファイルのエイリアスを作り、functionが呼び出しているファイルを消してそいつに変更する)

## NDN を適当に作る
docker pull hydrokhoos/ndn-all:arm
docker run -it hydrokhoos/ndn-all:arm
nfd-start

## ルートを確認
nlsrc routing

## NDN + NLSRの起動
```
# pip を変えてれば
pip install -r requirements.txt 

# 1
docker compose exec ndn-node-1 bash
./restart.sh
./auto_nlsr.sh 1

# 2
docker compose exec ndn-node-2 bash
./restart.sh
./auto_nlsr.sh 2
```

### 実行テスト(NDN tools)
```
# 1
echo 'Hello, world!' > /sample.txt
nlsrc advertise /sample.txt
ndnputchunks /sample.txt < /sample.txt

# 2
ndncatchunks /sample.txt
```

### 実行テスト(python package)
```
# 1
nlsrc advertise /example
python3 ./example/client_producer.py 

# 2
python3 ./example/client_consumer.py 
```
