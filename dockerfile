FROM hydrokhoos/ndn-all:arm

RUN apt update
RUN apt install -y tcpdump dnsutils iputils-ping net-tools netcat psmisc tmux