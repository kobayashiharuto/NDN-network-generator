const moment = require('moment');
// durationMS ヘルパー関数
const durationMS = (num) => { return { min: num, max: num + 1 } }

// スパンを生成する関数
async function generateSpansFromDB(root_request_id) {
  try {
    // packet_logsからデータを取得
    // const [packetLogs] = await connection.execute(`
    //   SELECT id, request_id, name, packet_type, source_ip, destination_ip, node_ip, received_time
    //   FROM packet_logs
    //   WHERE request_id = ? OR request_id IN (
    //     SELECT child_nonce FROM request_chain WHERE parent_nonce = ?
    //   )
    // `, [root_request_id, root_request_id]);

    // // request_chainからデータを取得
    // const [requestChain] = await connection.execute(`
    //   SELECT id, parent_nonce, child_nonce FROM request_chain
    //   WHERE parent_nonce = ? OR child_nonce IN (
    //     SELECT request_id FROM packet_logs WHERE request_id = ?
    //   )
    // `, [root_request_id, root_request_id]);

    packetLogs = [
      { id: 232, request_id: "3540754246", name: "/function1/service/( /function2/service/(/producer4/data), /producer3/data)", packet_type: 0, source_ip: "172.26.0.21", destination_ip: "172.26.0.11", node_ip: "172.26.0.11", received_time: "2024-12-03T19:42:43.971610" },
      { id: 233, request_id: "3540754246", name: "/function1/service/( /function2/service/(/producer4/data), /producer3/data)", packet_type: 0, source_ip: "172.26.0.11", destination_ip: "172.26.0.17", node_ip: "172.26.0.11", received_time: "2024-12-03T19:42:43.971873" },
      { id: 227, request_id: "3540754246", name: "/function1/service/( /function2/service/(/producer4/data), /producer3/data)", packet_type: 0, source_ip: "172.26.0.11", destination_ip: "172.26.0.17", node_ip: "172.26.0.17", received_time: "2024-12-03T19:42:43.971890" },
      { id: 229, request_id: "508474852", name: "/function2/service/(/producer4/data)", packet_type: 0, source_ip: "172.26.0.17", destination_ip: "172.26.0.18", node_ip: "172.26.0.17", received_time: "2024-12-03T19:42:43.984019" },
      { id: 238, request_id: "508474852", name: "/function2/service/(/producer4/data)", packet_type: 0, source_ip: "172.26.0.17", destination_ip: "172.26.0.18", node_ip: "172.26.0.18", received_time: "2024-12-03T19:42:43.984028" },
      { id: 240, request_id: "508474852", name: "/function2/service/(/producer4/data)", packet_type: 0, source_ip: "172.26.0.18", destination_ip: "172.26.0.16", node_ip: "172.26.0.18", received_time: "2024-12-03T19:42:43.984335" },
      { id: 225, request_id: "508474852", name: "/function2/service/(/producer4/data)", packet_type: 0, source_ip: "172.26.0.18", destination_ip: "172.26.0.16", node_ip: "172.26.0.16", received_time: "2024-12-03T19:42:43.984388" },
      { id: 230, request_id: "2847249617", name: "/producer3/data", packet_type: 0, source_ip: "172.26.0.17", destination_ip: "172.26.0.22", node_ip: "172.26.0.17", received_time: "2024-12-03T19:42:43.989514" },
      { id: 239, request_id: "2847249617", name: "/producer3/data", packet_type: 0, source_ip: "172.26.0.17", destination_ip: "172.26.0.22", node_ip: "172.26.0.22", received_time: "2024-12-03T19:42:43.989524" },
      { id: 241, request_id: "2847249617", name: "/producer3/data", packet_type: 0, source_ip: "172.26.0.22", destination_ip: "172.26.0.20", node_ip: "172.26.0.22", received_time: "2024-12-03T19:42:43.989702" },
      { id: 226, request_id: "1766022121", name: "/producer4/data", packet_type: 0, source_ip: "172.26.0.16", destination_ip: "172.26.0.10", node_ip: "172.26.0.16", received_time: "2024-12-03T19:42:43.996730" },
      { id: 234, request_id: "1766022121", name: "/producer4/data", packet_type: 0, source_ip: "172.26.0.16", destination_ip: "172.26.0.10", node_ip: "172.26.0.10", received_time: "2024-12-03T19:42:43.996748" },
      { id: 235, request_id: "1766022121", name: "/producer4/data", packet_type: 0, source_ip: "172.26.0.10", destination_ip: "172.26.0.19", node_ip: "172.26.0.10", received_time: "2024-12-03T19:42:43.997003" },
      { id: 242, request_id: "2847249617", name: "/producer3/data", packet_type: 1, source_ip: "172.26.0.20", destination_ip: "172.26.0.22", node_ip: "172.26.0.22", received_time: "2024-12-03T19:42:44.014338" },
      { id: 243, request_id: "2847249617", name: "/producer3/data", packet_type: 1, source_ip: "172.26.0.22", destination_ip: "172.26.0.17", node_ip: "172.26.0.22", received_time: "2024-12-03T19:42:44.014497" },
      { id: 231, request_id: "2847249617", name: "/producer3/data", packet_type: 1, source_ip: "172.26.0.22", destination_ip: "172.26.0.17", node_ip: "172.26.0.17", received_time: "2024-12-03T19:42:44.014505" },
      { id: 236, request_id: "1766022121", name: "/producer4/data", packet_type: 1, source_ip: "172.26.0.19", destination_ip: "172.26.0.10", node_ip: "172.26.0.10", received_time: "2024-12-03T19:42:44.015521" },
      { id: 237, request_id: "1766022121", name: "/producer4/data", packet_type: 1, source_ip: "172.26.0.10", destination_ip: "172.26.0.16", node_ip: "172.26.0.10", received_time: "2024-12-03T19:42:44.015779" },
      { id: 228, request_id: "1766022121", name: "/producer4/data", packet_type: 1, source_ip: "172.26.0.10", destination_ip: "172.26.0.16", node_ip: "172.26.0.16", received_time: "2024-12-03T19:42:44.015786" },
      { id: 247, request_id: "508474852", name: "/function2/service/(/producer4/data)", packet_type: 1, source_ip: "172.26.0.16", destination_ip: "172.26.0.18", node_ip: "172.26.0.16", received_time: "2024-12-03T19:42:44.544779" },
      { id: 245, request_id: "508474852", name: "/function2/service/(/producer4/data)", packet_type: 1, source_ip: "172.26.0.16", destination_ip: "172.26.0.18", node_ip: "172.26.0.18", received_time: "2024-12-03T19:42:44.544785" },
      { id: 246, request_id: "508474852", name: "/function2/service/(/producer4/data)", packet_type: 1, source_ip: "172.26.0.18", destination_ip: "172.26.0.17", node_ip: "172.26.0.18", received_time: "2024-12-03T19:42:44.544943" },
      { id: 244, request_id: "508474852", name: "/function2/service/(/producer4/data)", packet_type: 1, source_ip: "172.26.0.18", destination_ip: "172.26.0.17", node_ip: "172.26.0.17", received_time: "2024-12-03T19:42:44.544953" },
      { id: 250, request_id: "3540754246", name: "/function1/service/( /function2/service/(/producer4/data), /producer3/data)", packet_type: 1, source_ip: "172.26.0.17", destination_ip: "172.26.0.11", node_ip: "172.26.0.17", received_time: "2024-12-03T19:42:45.082491" },
      { id: 248, request_id: "3540754246", name: "/function1/service/( /function2/service/(/producer4/data), /producer3/data)", packet_type: 1, source_ip: "172.26.0.17", destination_ip: "172.26.0.11", node_ip: "172.26.0.11", received_time: "2024-12-03T19:42:45.082498" },
      { id: 249, request_id: "3540754246", name: "/function1/service/( /function2/service/(/producer4/data), /producer3/data)", packet_type: 1, source_ip: "172.26.0.11", destination_ip: "172.26.0.21", node_ip: "172.26.0.11", received_time: "2024-12-03T19:42:45.082737" },
    ];


    requestChain = [
      { id: 30, parent_nonce: 3540754246, child_nonce: 508474852 },
      { id: 31, parent_nonce: 3540754246, child_nonce: 2847249617 },
      { id: 32, parent_nonce: 508474852, child_nonce: 1766022121 },
    ]


    // パケットログの整形
    packetLogs.sort((a, b) => {
      const timeA = new Date(a.received_time).getTime();
      const timeB = new Date(b.received_time).getTime();

      if (timeA !== timeB) {
        return timeA - timeB;
      } else {
        // `received_time` を文字列として取得し、最後の5桁を比較
        const subTimeA = String(a.received_time).slice(-5); // 文字列に変換して最後の部分
        const subTimeB = String(b.received_time).slice(-5);
        return subTimeA.localeCompare(subTimeB);
      }
    });

    const logsByRequest = packetLogs.reduce((acc, log) => {
      if (!acc[log.request_id]) acc[log.request_id] = [];
      acc[log.request_id].push(log);
      return acc;
    }, {});

    const request_pairs = {};
    for (const requestID in logsByRequest) {
      const new_logs = logsByRequest[requestID];
      for (const log of new_logs) {
        if (log.packet_type === 1) continue;

        const pair = new_logs.find((l) =>
          l.packet_type === 1 &&
          l.source_ip === log.destination_ip &&
          l.destination_ip === log.source_ip &&
          l.node_ip === log.node_ip &&
          l.name === log.name
        );
        if (!pair) {
          throw new Error(`Pair not found for log: ${JSON.stringify(log)}`);
        }
        if (!request_pairs[requestID]) request_pairs[requestID] = [];
        request_pairs[requestID].push({ interest: log, data: pair });
      }
    }

    // ツリー構造の生成
    const spans = [];
    const rootRequestLogs = request_pairs[root_request_id];
    if (!rootRequestLogs || rootRequestLogs.length === 0) {
      throw new Error(`No logs found for root_request_id: ${root_request_id}`);
    }
    const rootDuration = moment(rootRequestLogs[0].data.received_time).diff(moment(rootRequestLogs[0].interest.received_time));
    spans.push({
      service: "consumer (" + rootRequestLogs[0].interest.source_ip + ")",
      name: "request " + rootRequestLogs[0].interest.name,
      duration: durationMS(rootDuration),
      startDuration: durationMS(0)
    });

    const graph = {};
    for (const chain of requestChain) {
      if (!graph[chain.parent_nonce]) graph[chain.parent_nonce] = [];
      graph[chain.parent_nonce].push(chain.child_nonce);
    }

    const dfs = (graph, start, visited, before_last_log, root, span_parent_idx) => {
      visited.add(start);
      const isProducer = !graph[start];
      const log_pairs = request_pairs[start];
      for (let i = 0; i < log_pairs.length; i++) {
        const log_pair = log_pairs[i];
        const interest = log_pair.interest;
        const data = log_pair.data;

        if (root && i === 0) continue;

        if (!root && i === 0) {
          spans.push({
            service: "function (" + interest.node_ip + ")",
            name: "request " + interest.name,
            duration: durationMS(moment(data.received_time).diff(moment(interest.received_time))),
            startDuration: durationMS(moment(interest.received_time).diff(moment(before_last_log.received_time))),
            parentIdx: span_parent_idx
          });
        } else if (i === log_pairs.length - 1) {
          spans.push({
            service: "router (" + interest.source_ip + ")",
            name: "forwarding " + interest.name,
            duration: durationMS(moment(data.received_time).diff(moment(interest.received_time))),
            startDuration: durationMS(moment(interest.received_time).diff(moment(before_last_log.received_time)))
          });

          if (isProducer) {
            spans.push({
              service: "producer (" + interest.destination_ip + ")",
              name: "producing " + interest.name,
              duration: durationMS(moment(data.received_time).diff(moment(interest.received_time))),
              startDuration: durationMS(moment(interest.received_time).diff(moment(before_last_log.received_time)))
            });
          } else {
            spans.push({
              service: "function (" + interest.destination_ip + ")",
              name: interest.name,
              duration: durationMS(moment(data.received_time).diff(moment(interest.received_time))),
              startDuration: durationMS(moment(interest.received_time).diff(moment(before_last_log.received_time)))
            });
          }
        } else {
          spans.push({
            service: "router (" + interest.node_ip + ")",
            name: "request " + interest.name,
            duration: durationMS(moment(data.received_time).diff(moment(interest.received_time))),
            startDuration: durationMS(moment(interest.received_time).diff(moment(before_last_log.received_time)))
          });
        }
        before_last_log = interest;
      }

      if (isProducer) return;

      span_parent_idx = spans.length - 1;
      for (const neighbor of graph[start]) {
        if (!visited.has(neighbor)) {
          dfs(graph, neighbor, visited, before_last_log, false, span_parent_idx);
        }
      }
    };

    const visited = new Set();
    dfs(graph, root_request_id, visited, rootRequestLogs[0].interest, true, 0);

    return spans;
  } catch (err) {
    throw err;
  }
}



// メイン関数
(async () => {
  try {
    const spans = await generateSpansFromDB('3540754246');
    console.log(spans);
  } catch (err) {
    console.error(err);
  } finally {
  }
}
)();