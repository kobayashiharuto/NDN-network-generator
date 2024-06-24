config/functions 配下の、functionノード自体の名前と対応するファイルの exec を呼び出す
(k8sでconfigごとマウントして、そのファイルのエイリアスを作り、functionが呼び出しているファイルを消してそいつに変更する)

## NDN を適当に作る
docker pull hydrokhoos/ndn-all:arm
docker run -it hydrokhoos/ndn-all:arm
nfd-start

## ルートを確認
nlsrc routing

## NDN開発環境を作る
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

### arc
```
docker compose exec ndn-node-1 bash
docker compose exec ndn-node-2 bash

cd /workspaces
./restart.sh
./auto_nlsr.sh 1
./auto_nlsr.sh 1
ndnsec key-gen / | ndnsec cert-install -

# 1
nfd-start 2> /nfd.log
nlsr -f nlsr-1.conf &
nfdc face create tcp4://ndn-node-2
ndncatchunks /sample.txt

# 2
nfd-start 2> /nfd.log
nlsr -f nlsr-2.conf &
nfdc face create tcp4://ndn-node-1
echo 'Hello, world!' > /sample.txt
nlsrc advertise /sample.txt
ndnputchunks /sample.txt < /sample.txt
```