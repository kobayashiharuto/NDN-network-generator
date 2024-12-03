// index.js

const moment = require('moment');

// パケットログデータ
const logs = [
  { id: 19, request_id: '1163820534', name: '/function1/service/(/producer1/data, /producer2/data)', packet_type: 0, source_ip: '172.26.0.10', destination_ip: '172.26.0.14', node_ip: '172.26.0.14', received_time: '2024-12-03T10:58:22.235Z' },
  { id: 20, request_id: '1163820534', name: '/function1/service/(/producer1/data, /producer2/data)', packet_type: 0, source_ip: '172.26.0.14', destination_ip: '172.26.0.8', node_ip: '172.26.0.14', received_time: '2024-12-03T10:58:22.236Z' },
  { id: 16, request_id: '2180948974', name: '/producer1/data', packet_type: 0, source_ip: '172.26.0.8', destination_ip: '172.26.0.13', node_ip: '172.26.0.13', received_time: '2024-12-03T10:58:22.246Z' },
  { id: 18, request_id: '2180948974', name: '/producer1/data', packet_type: 0, source_ip: '172.26.0.13', destination_ip: '172.26.0.11', node_ip: '172.26.0.13', received_time: '2024-12-03T10:58:22.247Z' },
  { id: 13, request_id: '2847240376', name: '/producer2/data', packet_type: 0, source_ip: '172.26.0.8', destination_ip: '172.26.0.12', node_ip: '172.26.0.12', received_time: '2024-12-03T10:58:22.252Z' },
  { id: 14, request_id: '2847240376', name: '/producer2/data', packet_type: 0, source_ip: '172.26.0.12', destination_ip: '172.26.0.15', node_ip: '172.26.0.12', received_time: '2024-12-03T10:58:22.253Z' },
  { id: 21, request_id: '2180948974', name: '/producer1/data', packet_type: 1, source_ip: '172.26.0.11', destination_ip: '172.26.0.13', node_ip: '172.26.0.13', received_time: '2024-12-03T10:58:22.264Z' },
  { id: 22, request_id: '2180948974', name: '/producer1/data', packet_type: 1, source_ip: '172.26.0.13', destination_ip: '172.26.0.8', node_ip: '172.26.0.13', received_time: '2024-12-03T10:58:22.265Z' },
  { id: 15, request_id: '2847240376', name: '/producer2/data', packet_type: 1, source_ip: '172.26.0.15', destination_ip: '172.26.0.12', node_ip: '172.26.0.12', received_time: '2024-12-03T10:58:22.267Z' },
  { id: 17, request_id: '2847240376', name: '/producer2/data', packet_type: 1, source_ip: '172.26.0.12', destination_ip: '172.26.0.8', node_ip: '172.26.0.12', received_time: '2024-12-03T10:58:22.268Z' },
  { id: 23, request_id: '1163820534', name: '/function1/service/(/producer1/data, /producer2/data)', packet_type: 1, source_ip: '172.26.0.8', destination_ip: '172.26.0.14', node_ip: '172.26.0.14', received_time: '2024-12-03T10:58:22.793Z' },
  { id: 24, request_id: '1163820534', name: '/function1/service/(/producer1/data, /producer2/data)', packet_type: 1, source_ip: '172.26.0.14', destination_ip: '172.26.0.10', node_ip: '172.26.0.14', received_time: '2024-12-03T10:58:22.794Z' },
];

// request_chain データ（親子関係）
const requestChain = {
  '1163820534': null, // ルートリクエスト
  '2180948974': '1163820534',
  '2847240376': '1163820534',
};

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
  const startDuration = moment(firstRouterFowardingInterestLog.received_time).diff(moment(firstRouterReceiveInterestLog.received_time));
  const firstRouterFowardingSpan = {
    service: "router (" + firstRouterFowardingInterestLog.node_ip + ")",
    name: "fowarding " + firstRouterReceiveInterestLog.name,
    duration: durationMS(firstRouterFowardingDuration),
    startDuration: durationMS(startDuration)
  }

  // ここからは request ごとに


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
