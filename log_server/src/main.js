import { sleep } from 'k6';
import tracing from 'k6/x/tracing';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
    vus: 1,
    duration: "20m",
};

const duration = (num) => { return { min: num, max: num + 1 } }

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
    // {
    //     defaults: traceDefaults,
    //     spans: [
    //         { service: "consumer", name: "request", duration: { min: 110, max: 110 } },
    //         { service: "function1", name: "/function1/a", duration: { min: 100, max: 100 } },
    //         { service: "router1", name: "forwarding", duration: { min: 10, max: 11 } },

    //         { service: "router1", name: "forwarding", parentIdx: 1 },
    //         { service: "router2", name: "forwarding" },
    //         { service: "router2", name: "forwarding" },
    //         { service: "producer2", name: "huga" },

    //         { service: "router1", name: "forwarding", parentIdx: 1 },
    //         { service: "producer1", name: "query-articles" },
    //         // {
    //         //     service: "article-service",
    //         //     name: "list-articles",
    //         //     links: [{ attributes: { "link-type": "parent-child" }, randomAttributes: { count: 2, cardinality: 5 } }]
    //         // },
    //         // { service: "article-service", name: "select-articles", attributeSemantics: tracing.SEMANTICS_DB },
    //         // { service: "postgres", name: "query-articles", attributeSemantics: tracing.SEMANTICS_DB, randomAttributes: { count: 5 } },
    //     ]
    // },
    // {
    //     defaults: traceDefaults,
    //     spans: [
    //         { service: "shop-backend", name: "list-articles", duration: { min: 200, max: 900 } },
    //         { service: "shop-backend", name: "authenticate", duration: { min: 50, max: 100 } },
    //         { service: "auth-service", name: "authenticate" },
    //         { service: "shop-backend", name: "fetch-articles", parentIdx: 0 },
    //         {
    //             service: "article-service",
    //             name: "list-articles",
    //             links: [{ attributes: { "link-type": "parent-child" }, randomAttributes: { count: 2, cardinality: 5 } }]
    //         },
    //         { service: "article-service", name: "select-articles", attributeSemantics: tracing.SEMANTICS_DB },
    //         { service: "postgres", name: "query-articles", attributeSemantics: tracing.SEMANTICS_DB, randomAttributes: { count: 5 } },
    //     ]
    // },

    // 基本的な動き
    {
        defaults: {
            attributes: { "numbers": ["one", "two", "three"] },
            // attributeSemantics: tracing.SEMANTICS_HTTP,
            // randomEvents: { count: 2, randomAttributes: { count: 3, cardinality: 10 } },
        },
        spans: [
            // { service: "producer", name: "request /func1/ex/(/prod1/data)", startDuration: duration(5), duration: duration(200) },
            // { service: "router1", name: "request /func1/ex/(/prod1/data)", startDuration: duration(5), duration: duration(190) },
            // { service: "router1", name: "fowarding func1", startDuration: duration(5), duration: duration(70) },
            // { name: "func1 /func1/ex/(/prod1/data)", startDuration: duration(5), duration: duration(180) },
            // { service: "func1", name: "processing func1", startDuration: duration(120), duration: duration(170) },
            // { name: "request /prod1/data", parentIdx: 3, startDuration: duration(5), duration: duration(30) },
            // { service: "router1", name: "request /prod1/data", startDuration: duration(5), duration: duration(20) },
            // { service: "router1", name: "fowarding prod1", startDuration: duration(5), duration: duration(10) },
            // { service: "prod1", name: "producing /prod1/data", startDuration: duration(5), duration: duration(50) },

            { service: "consumer", name: "request /func1/re/(/func2/ex/(/prod1/data), /prod2/data)", duration: duration(500) },
            { service: "router1", name: "request /func1/re/(/func2/ex/(/prod1/data), /prod2/data)", duration: duration(490), startDuration: duration(0) },
            { service: "router1", name: "fowarding func1", startDuration: duration(5), duration: duration(480) },
            { service: "func1", name: "/func1/re/(/func2/ex/(/prod1/data), /prod2/data)", startDuration: duration(5), duration: duration(470) },

            { service: "func1", name: "request /func2/ex/(/prod1/data)", startDuration: duration(5), duration: duration(400) },
            { service: "router2", name: "request /func2/ex/(/prod1/data)", startDuration: duration(5), duration: duration(380) },
            { service: "router2", name: "fowarding func2", startDuration: duration(5), duration: duration(360) },
            { service: "func2", name: "/func2/ex/(/prod1/data)", startDuration: duration(5), duration: duration(340) },

            { service: "func2", name: "request /prod1/data", startDuration: duration(5), duration: duration(110) },
            { service: "router3", name: "request /prod1/data", startDuration: duration(5), duration: duration(85) },
            { service: "router3", name: "fowarding prod1", startDuration: duration(5), duration: duration(70) },
            { service: "prod1", name: "producing /prod1/data", startDuration: duration(5), duration: duration(50) },

            { service: "func1", name: "request /prod2/data", parentIdx: 3, startDuration: duration(5), duration: duration(100) },
            { service: "router4", name: "request /prod2/data", startDuration: duration(5), duration: duration(90) },
            { service: "router4", name: "fowarding prod2", startDuration: duration(5), duration: duration(66) },
            { service: "prod2", name: "producing /prod2/data", startDuration: duration(5), duration: duration(50) },
        ]
    },

    // イベントを送ってみる
    // {
    //     defaults: {
    //         attributes: { "numbers": ["one", "two", "three"] },
    //         attributeSemantics: tracing.SEMANTICS_HTTP,
    //         randomEvents: { count: 2, randomAttributes: { count: 3, cardinality: 10 } },
    //     },
    //     spans: [
    //         { service: "shop-backend", name: "article-to-cart", duration: { min: 400, max: 1200 } },
    //         { service: "shop-backend", name: "authenticate", duration: { min: 70, max: 200 } },
    //         { service: "auth-service", name: "authenticate" },
    //         { service: "shop-backend", name: "get-article", parentIdx: 0 },
    //         { service: "article-service", name: "get-article" },
    //         { service: "article-service", name: "select-articles", attributeSemantics: tracing.SEMANTICS_DB },
    //         { service: "postgres", name: "query-articles", attributeSemantics: tracing.SEMANTICS_DB, randomAttributes: { count: 2 } },
    //         { service: "shop-backend", name: "place-articles", parentIdx: 0 },
    //         { service: "cart-service", name: "place-articles", attributes: { "article.count": 1, "http.status_code": 201 } },
    //         { service: "cart-service", name: "persist-cart" }
    //     ]
    // },
    // {
    //     defaults: traceDefaults,
    //     spans: [
    //         { service: "shop-backend", attributes: { "http.status_code": 403 } },
    //         { service: "shop-backend", name: "authenticate", attributes: { "http.request.header.accept": ["application/json"] } },
    //         {
    //             service: "auth-service",
    //             name: "authenticate",
    //             attributes: { "http.status_code": 403 },
    //             randomEvents: { count: 0.5, exceptionCount: 2, randomAttributes: { count: 5, cardinality: 5 } }
    //         },
    //     ]
    // },
    // {
    //     defaults: traceDefaults,
    //     spans: [
    //         { service: "shop-backend" },
    //         { service: "shop-backend", name: "authenticate", attributes: { "http.request.header.accept": ["application/json"] } },
    //         { service: "auth-service", name: "authenticate" },
    //         {
    //             service: "cart-service",
    //             name: "checkout",
    //             randomEvents: { count: 0.5, exceptionCount: 2, exceptionOnError: true, randomAttributes: { count: 5, cardinality: 5 } }
    //         },
    //         {
    //             service: "billing-service",
    //             name: "payment",
    //             randomLinks: { count: 0.5, randomAttributes: { count: 3, cardinality: 10 } },
    //             randomEvents: { exceptionOnError: true, randomAttributes: { count: 4 } }
    //         }
    //     ]
    // },
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