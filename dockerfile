FROM hydrokhoos/ndn-all:arm

# パッケージの追加
RUN apt update
RUN apt install -y tcpdump dnsutils iputils-ping net-tools netcat psmisc tmux

# 新しいユーザーを作成
RUN useradd -ms /bin/bash myuser

# 作業ディレクトリの設定
WORKDIR /workspaces

# 必要なパッケージをコピー
COPY requirements.txt /workspaces/

# ユーザーを変更
USER myuser

# 必要なパッケージをインストール
RUN pip install --user --upgrade pip && pip install --user -r requirements.txt

# ルートユーザーに戻す
USER root