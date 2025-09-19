import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  scenarios: {
    ramp_up_test: {
      executor: 'ramping-vus',   // tăng dần số VU
      startVUs: 0,               // bắt đầu từ 0 user
      stages: [
        { duration: '1m', target: 50 },   // 1 phút tăng lên 50 VUs
        { duration: '2m', target: 100 },  // 2 phút tiếp theo tăng lên 100 VUs
        { duration: '2m', target: 200 },  // 2 phút tiếp theo tăng lên 200 VUs
        { duration: '1m', target: 0 },    // giảm dần về 0
      ],
      gracefulRampDown: '30s',
    },
  },
};

export default function () {
  const res = http.get('http://localhost:4321/');
  sleep(1);
}

