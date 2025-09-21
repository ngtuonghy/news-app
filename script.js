import http from "k6/http";
import { sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

// Custom metrics
export let reqTrend = new Trend("request_duration_trend"); // lưu thời gian xử lý
export let reqFailed = new Rate("request_failed_rate");    // lưu tỷ lệ request thất bại

export const options = {
  scenarios: {
    stress_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 100 },   // từ 0 → 100 VUs
        { duration: "2m", target: 200 },   // 100 → 200 VUs
        { duration: "2m", target: 400 },   // 200 → 400 VUs
        { duration: "2m", target: 800 },   // 400 → 800 VUs
        { duration: "2m", target: 0 },     // hạ dần về 0
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% request < 2s
    request_failed_rate: ["rate<0.05"], // <5% request lỗi
  },
};

export default function () {
  let res = http.get("http://localhost:4321/");

  reqTrend.add(res.timings.duration);

  reqFailed.add(res.status >= 400);

  sleep(0.1);
}


