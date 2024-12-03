import { sleep } from 'k6';
import tracing from 'k6/x/tracing';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
    vus: 1,
    duration: "20m",
};

const durationMS = (num) => { return { min: num, max: num + 1 } }

const endpoint = __ENV.ENDPOINT || "otel-collector:4317"
const orgid = __ENV.TEMPO_X_SCOPE_ORGID || "k6-test"
const client = new tracing.Client({
    endpoint,
    exporter: tracing.EXPORTER_OTLP,
    tls: {
        insecure: true,
    },
    headers: {
        "X-Scope-Orgid": orgid
    }
});

const traceDefaults = {
    attributeSemantics: tracing.SEMANTICS_HTTP,
    attributes: { "one": "three" },
    randomAttributes: { count: 2, cardinality: 5 },
    randomEvents: { count: 0.1, exceptionCount: 0.2, randomAttributes: { count: 6, cardinality: 20 } },
}

const traceTemplates = [
    {
        defaults: {
            attributes: { "numbers": ["one", "two", "three"] },
        },
        spans: [

            // { service: "consumer", name: "request /func1/re/(/func2/ex/(/prod1/data), /prod2/data)", duration: duration(500) },
            // { service: "router1", name: "request /func1/re/(/func2/ex/(/prod1/data), /prod2/data)", duration: duration(490), startDuration: duration(0) },
            // { service: "router1", name: "fowarding func1", startDuration: duration(5), duration: duration(480) },
            // { service: "func1", name: "/func1/re/(/func2/ex/(/prod1/data), /prod2/data)", startDuration: duration(5), duration: duration(470) },

            // { service: "func1", name: "request /func2/ex/(/prod1/data)", startDuration: duration(5), duration: duration(400) },
            // { service: "router2", name: "request /func2/ex/(/prod1/data)", startDuration: duration(5), duration: duration(380) },
            // { service: "router2", name: "fowarding func2", startDuration: duration(5), duration: duration(360) },
            // { service: "func2", name: "/func2/ex/(/prod1/data)", startDuration: duration(5), duration: duration(340) },

            // { service: "func2", name: "request /prod1/data", startDuration: duration(5), duration: duration(110) },
            // { service: "router3", name: "request /prod1/data", startDuration: duration(5), duration: duration(85) },
            // { service: "router3", name: "fowarding prod1", startDuration: duration(5), duration: duration(70) },
            // { service: "prod1", name: "producing /prod1/data", startDuration: duration(5), duration: duration(50) },

            // { service: "func1", name: "request /prod2/data", parentIdx: 3, startDuration: duration(5), duration: duration(100) },
            // { service: "router4", name: "request /prod2/data", startDuration: duration(5), duration: duration(90) },
            // { service: "router4", name: "fowarding prod2", startDuration: duration(5), duration: duration(66) },
            // { service: "prod2", name: "producing /prod2/data", startDuration: duration(5), duration: duration(50) },

            { service: "consumer (172.26.0.10)", name: "request /function1/service/(/producer1/data, /producer2/data)", duration: durationMS(500) },
            { service: "router (172.26.0.11)", name: "request /function1/service/(/producer1/data, /producer2/data)", duration: durationMS(490), startDuration: durationMS(0) },
            { service: "router (172.26.0.11)", name: "fowarding function1", startDuration: durationMS(5), duration: durationMS(480) },
            { service: "function (172.26.0.9)", name: "/function1/service/(/producer1/data, /producer2/data)", startDuration: durationMS(5), duration: durationMS(470) },

            { service: "function (172.26.0.9)", name: "request /producer1/data", parentIdx: 3, startDuration: durationMS(5), duration: durationMS(110) },
            { service: "router (172.26.0.12)", name: "request /producer1/data", startDuration: durationMS(5), duration: durationMS(85) },
            { service: "router (172.26.0.12)", name: "fowarding producer1", startDuration: durationMS(5), duration: durationMS(70) },
            { service: "producer (172.26.0.8)", name: "producing /producer1/data", startDuration: durationMS(5), duration: durationMS(50) },

            { service: "function (172.26.0.9)", name: "request /producer2/data", parentIdx: 3, startDuration: durationMS(5), duration: durationMS(100) },
            { service: "router (172.26.0.13)", name: "request /producer2/data", startDuration: durationMS(5), duration: durationMS(90) },
            { service: "router (172.26.0.13)", name: "fowarding producer2", startDuration: durationMS(5), duration: durationMS(66) },
            { service: "producer  (172.26.0.7)", name: "producing /producer2/data", startDuration: durationMS(5), duration: durationMS(50) },
        ]
    },
]

export default function () {
    const templateIndex = randomIntBetween(0, traceTemplates.length - 1)
    const gen = new tracing.TemplatedGenerator(traceTemplates[templateIndex])
    client.push(gen.traces())

    sleep(randomIntBetween(100000, 100000));
}

export function teardown() {
    client.shutdown();
}

