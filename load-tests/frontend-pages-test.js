import http from "k6/http";
import { check, sleep, group } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "40s", target: 10 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1000"],
    checks: ["rate>0.95"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:4173";

export default function () {
  group("Загрузка основных публичных страниц", function () {
    const pages = [
      { path: "/", name: "Главная страница" },
      { path: "/login", name: "Страница авторизации" },
      { path: "/register", name: "Страница регистрации" },
    ];

    for (const page of pages) {
      const res = http.get(`${BASE_URL}${page.path}`);

      check(res, {
        [`${page.name}: статус 200`]: (r) => r.status === 200,
        [`${page.name}: время ответа менее 1000 мс`]: (r) =>
          r.timings.duration < 1000,
        [`${page.name}: получен HTML-документ`]: (r) =>
          String(r.headers["Content-Type"] || "").includes("text/html"),
      });

      sleep(1);
    }
  });
}