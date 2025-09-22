import http from "k6/http";
import { sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

// Custom metrics
export let reqTrend = new Trend("request_duration_trend");
export let reqFailed = new Rate("request_failed_rate");   
export const options = {
  scenarios: {
    stress_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 100 },  
        { duration: "20s", target: 200 },  
        { duration: "20s", target: 400 },   
        { duration: "20s", target: 800 }, 
        { duration: "20s", target: 1000 },  
        { duration: "20s", target: 1200 },  
        { duration: "20s", target: 1400 },  
        { duration: "20s", target: 1600 },  
        { duration: "20s", target: 1800 },  
        { duration: "20s", target: 2000 },
        { duration: "20s", target: 2200 },
        { duration: "20s", target: 2400 },
        { duration: "20s", target: 2600 },
        { duration: "20s", target: 2800 },
        { duration: "20s", target: 3000 }, 
        { duration: "20s", target: 3200 },
        { duration: "20s", target: 3400 },
        { duration: "20s", target: 3600 },
        { duration: "20s", target: 3800 },
        { duration: "20s", target: 4000 },
        { duration: "20s", target: 0 },

        
      ],
      gracefulRampDown: "10s",
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

  sleep(0.05);
}


