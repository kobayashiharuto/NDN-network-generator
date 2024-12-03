// index.js

const moment = require('moment');

// パケットログデータ
const logs = [
  { id: 84, session: 2201794901, path: "/function1/service/(/producer1/data, /producer2/data)", flag: 1, src: "172.26.0.12", dest: "172.26.0.13", nextHop: "172.26.0.12", timestamp: "2024-12-03 13:03:03.824151" },
  { id: 83, session: 2201794901, path: "/function1/service/(/producer1/data, /producer2/data)", flag: 1, src: "172.26.0.10", dest: "172.26.0.12", nextHop: "172.26.0.12", timestamp: "2024-12-03 13:03:03.823998" },
  { id: 82, session: 2201794901, path: "/function1/service/(/producer1/data, /producer2/data)", flag: 1, src: "172.26.0.10", dest: "172.26.0.12", nextHop: "172.26.0.10", timestamp: "2024-12-03 13:03:03.823992" },
  { id: 75, session: 3547770322, path: "/producer2/data", flag: 1, src: "172.26.0.15", dest: "172.26.0.10", nextHop: "172.26.0.10", timestamp: "2024-12-03 13:03:03.291683" },
  { id: 79, session: 3547770322, path: "/producer2/data", flag: 1, src: "172.26.0.15", dest: "172.26.0.10", nextHop: "172.26.0.15", timestamp: "2024-12-03 13:03:03.291678" },
  { id: 78, session: 3547770322, path: "/producer2/data", flag: 1, src: "172.26.0.14", dest: "172.26.0.15", nextHop: "172.26.0.15", timestamp: "2024-12-03 13:03:03.291509" },
  { id: 74, session: 2991219386, path: "/producer1/data", flag: 1, src: "172.26.0.11", dest: "172.26.0.10", nextHop: "172.26.0.10", timestamp: "2024-12-03 13:03:03.288407" },
  { id: 73, session: 2991219386, path: "/producer1/data", flag: 1, src: "172.26.0.11", dest: "172.26.0.10", nextHop: "172.26.0.11", timestamp: "2024-12-03 13:03:03.288214" },
  { id: 72, session: 2991219386, path: "/producer1/data", flag: 1, src: "172.26.0.9", dest: "172.26.0.11", nextHop: "172.26.0.11", timestamp: "2024-12-03 13:03:03.287894" },
  { id: 77, session: 3547770322, path: "/producer2/data", flag: 0, src: "172.26.0.15", dest: "172.26.0.14", nextHop: "172.26.0.15", timestamp: "2024-12-03 13:03:03.267557" },
  { id: 76, session: 3547770322, path: "/producer2/data", flag: 0, src: "172.26.0.10", dest: "172.26.0.15", nextHop: "172.26.0.15", timestamp: "2024-12-03 13:03:03.267185" },
  { id: 71, session: 3547770322, path: "/producer2/data", flag: 0, src: "172.26.0.10", dest: "172.26.0.15", nextHop: "172.26.0.10", timestamp: "2024-12-03 13:03:03.267171" },
  { id: 69, session: 2991219386, path: "/producer1/data", flag: 0, src: "172.26.0.11", dest: "172.26.0.9", nextHop: "172.26.0.11", timestamp: "2024-12-03 13:03:03.259520" },
  { id: 67, session: 2991219386, path: "/producer1/data", flag: 0, src: "172.26.0.10", dest: "172.26.0.11", nextHop: "172.26.0.11", timestamp: "2024-12-03 13:03:03.259272" },
  { id: 70, session: 2991219386, path: "/producer1/data", flag: 0, src: "172.26.0.10", dest: "172.26.0.11", nextHop: "172.26.0.10", timestamp: "2024-12-03 13:03:03.259262" },
  { id: 68, session: 2201794901, path: "/function1/service/(/producer1/data, /producer2/data)", flag: 0, src: "172.26.0.12", dest: "172.26.0.10", nextHop: "172.26.0.10", timestamp: "2024-12-03 13:03:03.242613" },
  { id: 81, session: 2201794901, path: "/function1/service/(/producer1/data, /producer2/data)", flag: 0, src: "172.26.0.12", dest: "172.26.0.10", nextHop: "172.26.0.12", timestamp: "2024-12-03 13:03:03.242597" },
  { id: 80, session: 2201794901, path: "/function1/service/(/producer1/data, /producer2/data)", flag: 0, src: "172.26.0.13", dest: "172.26.0.12", nextHop: "172.26.0.12", timestamp: "2024-12-03 13:03:03.242476" }
];

const request_chain = [
  { id: 11, parent_nonce: 2201794901, child_nonce: 2991219386 },
  { id: 12, parent_nonce: 2201794901, child_nonce: 3547770322 }
]

const root_request_id = 2201794901;

// durationMS ヘルパー関数
const durationMS = (num) => num;

// スパンを生成する関数
function generateSpans(logs, requestChain) {
  const spans = [];

  let index_cursor = 0;

  // まず一番最初と最後のログから全体の時間を計算
  const firstLog = logs[0];
  const lastLog = logs[logs.length - 1];
  const startTime = moment(firstLog.received_time);
  const endTime = moment(lastLog.received_time);
  const totalDuration = endTime.diff(startTime);

  // ここで consumer のスパンを生成
  // まずは最初のログからIPアドレスを取得
  const consumerIP = firstLog.source_ip;
  // consumer のスパンを生成
  const consumerSpan =
  {
    service: "consumer (" + consumerIP + ")",
    name: "request " + firstLog.name,
    duration: durationMS(totalDuration)
  }

  spans.push(consumerSpan);
  index_cursor++;

  // ここからは最初のサービスまでのスパンを作成していく
  // まず index_cursor から最初のルーター receive ログを参照。そして、対応する data ログとして packet_type == 1 && name == name && source_ip == destination_ip が一致するものを探して duration を計算する
  const firstRouterReceiveInterestLog = logs[index_cursor];
  const firstRouterFowardingDataLog = logs.find(log => log.packet_type === 1 && log.name === firstRouterReceiveLog.name && log.source_ip === firstRouterReceiveLog.destination_ip);
  const firstRouterDuration = moment(firstRouterFowardingDataLog.received_time).diff(moment(firstRouterReceiveInterestLog.received_time));
  const firstRouterSpan = {
    service: "router (" + firstRouterReceiveInterestLog.node_ip + ")",
    name: "request " + firstRouterReceiveInterestLog.name,
    duration: durationMS(firstRouterDuration),
    startDuration: durationMS(0)
  }

  spans.push(firstRouterSpan);
  index_cursor++;

  // 次に、最初のルーターがフォワーディングしてからdataをレシーブするまでのスパンを作成
  const firstRouterFowardingInterestLog = logs[index_cursor];
  const firstRouterDataLog = logs.find(log => log.packet_type === 1 && log.name === firstRouterReceiveLog.name && log.source_ip === firstRouterReceiveLog.destination_ip);
  const firstRouterFowardingDuration = moment(firstRouterDataLog.received_time).diff(moment(firstRouterFowardingInterestLog.received_time));
  // startDuration はルーターがレシーブした時間とフォワーディングした時間の差
  const firstRouterStartDuration = moment(firstRouterFowardingInterestLog.received_time).diff(moment(firstRouterReceiveInterestLog.received_time));
  const firstRouterFowardingSpan = {
    service: "router (" + firstRouterFowardingInterestLog.node_ip + ")",
    name: "fowarding " + firstRouterReceiveInterestLog.name,
    duration: durationMS(firstRouterFowardingDuration),
    startDuration: durationMS(firstRouterStartDuration)
  }

  index_cursor++;

  // そして1リクエストの最後として、サービスでのinterestレシーブとデータのフォワーディングのスパンを作成
  // { service: "function (172.26.0.9)", name: "/function1/service/(/producer1/data, /producer2/data)", startDuration: durationMS(5), duration: durationMS(470) },
  const firstServiceInterestLog = logs[index_cursor];
  const firstServiceDataLog = logs.find(log => log.packet_type === 1 && log.name === firstServiceInterestLog.name && log.source_ip === firstServiceInterestLog.destination_ip);
  const firstServiceDuration = moment(firstServiceDataLog.received_time).diff(moment(firstServiceInterestLog.received_time));
  const firstServiceStartDuration = moment(firstServiceInterestLog.received_time).diff(moment(firstRouterFowardingInterestLog.received_time));
  const firstServiceSpan = {
    service: "function (" + firstServiceInterestLog.node_ip + ")",
    name: firstServiceInterestLog.name,
    duration: durationMS(firstServiceDuration),
    startDuration: durationMS(firstServiceStartDuration)
  }

  spans.push(firstServiceSpan);
  index_cursor++;

  // サービスの次はサービスがリクエストする新しいリクエストとなる
  // 同じノリでサービスがproducerに辿り着くまで潜っていく



  return spans;
}

// ノードの役割を推測する関数
function deduceRole(log, requestChain) {
  const { packet_type, source_ip, destination_ip, node_ip, request_id } = log;
  const parent_request_id = requestChain[request_id];

  if (node_ip === '172.26.0.10') {
    return 'consumer';
  } else if (node_ip === '172.26.0.14' && parent_request_id === null) {
    return 'function';
  } else if (['172.26.0.8', '172.26.0.15', '172.26.0.11'].includes(node_ip)) {
    return 'producer';
  } else {
    return 'router';
  }
}

// スパン名を生成する関数
function generateSpanName(role, name, packet_type) {
  if (role === 'consumer') {
    return `request ${name}`;
  } else if (role === 'producer') {
    return `producing ${name}`;
  } else if (role === 'router') {
    if (packet_type === 0) {
      return `forwarding ${name}`;
    } else {
      return `returning ${name}`;
    }
  } else if (role === 'function') {
    return `${name}`;
  }
  return `${name}`;
}

// 親スパンのインデックスを見つける関数
function findParentSpanIndex(span, spanList, requestChain) {
  // まず、親リクエストIDを取得
  const parentRequestId = requestChain[span.request_id];

  if (parentRequestId) {
    // 親リクエストIDを持つスパンを検索
    const parentSpan = spanList.find((s) => s.request_id === parentRequestId && s.role !== 'router');
    if (parentSpan) {
      return parentSpan.index;
    }
  } else {
    // ルートの場合、consumerを親とする
    if (span.role === 'function') {
      const consumerSpan = spanList.find((s) => s.role === 'consumer');
      if (consumerSpan) {
        return consumerSpan.index;
      }
    }
  }
  return null;
}

// 役割に基づいて推定持続時間を返す関数
function estimateDuration(role) {
  switch (role) {
    case 'consumer':
      return 500;
    case 'router':
      return 100;
    case 'function':
      return 470;
    case 'producer':
      return 50;
    default:
      return 100;
  }
}

// スパンを生成
const spans = generateSpans(logs, requestChain);

// 結果を出力
console.log(JSON.stringify(spans, null, 2));
