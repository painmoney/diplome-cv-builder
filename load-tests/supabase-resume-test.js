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
    http_req_duration: ["p(95)<1500"],
    checks: ["rate>0.95"],
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL;
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const TEST_EMAIL = __ENV.TEST_EMAIL;
const TEST_PASSWORD = __ENV.TEST_PASSWORD;

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Не задана переменная окружения: ${name}`);
  }
}

export function setup() {
  requireEnv("SUPABASE_URL", SUPABASE_URL);
  requireEnv("SUPABASE_ANON_KEY", SUPABASE_ANON_KEY);
  requireEnv("TEST_EMAIL", TEST_EMAIL);
  requireEnv("TEST_PASSWORD", TEST_PASSWORD);

  const loginRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  const loginOk = check(loginRes, {
    "Авторизация тестового пользователя: статус 200": (r) => r.status === 200,
    "Авторизация тестового пользователя: получен access_token": (r) =>
      Boolean(r.json("access_token")),
  });

  if (!loginOk) {
    throw new Error(
      `Ошибка авторизации. Статус: ${loginRes.status}. Ответ: ${loginRes.body}`
    );
  }

  const token = loginRes.json("access_token");

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const resumeRes = http.get(
    `${SUPABASE_URL}/rest/v1/resumes?select=id,title,updated_at&limit=1`,
    { headers }
  );

  const resumeOk = check(resumeRes, {
    "Получение резюме в setup: статус 200": (r) => r.status === 200,
    "Получение резюме в setup: найдена запись": (r) => {
      const body = r.json();
      return Array.isArray(body) && body.length > 0 && Boolean(body[0].id);
    },
  });

  if (!resumeOk) {
    throw new Error(
      `У тестового пользователя не найдена запись в resumes. Статус: ${resumeRes.status}. Ответ: ${resumeRes.body}`
    );
  }

  const resumes = resumeRes.json();

  return {
    token,
    resumeId: resumes[0].id,
  };
}

export default function (data) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${data.token}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };

  group("Чтение данных резюме из Supabase", function () {
    const getRes = http.get(
      `${SUPABASE_URL}/rest/v1/resumes?select=id,title,updated_at&id=eq.${data.resumeId}`,
      { headers }
    );

    check(getRes, {
      "GET resumes: статус 200": (r) => r.status === 200,
      "GET resumes: время ответа менее 1500 мс": (r) =>
        r.timings.duration < 1500,
      "GET resumes: получен массив данных": (r) => Array.isArray(r.json()),
    });
  });

  group("Обновление основной записи резюме в Supabase", function () {
    const patchRes = http.patch(
      `${SUPABASE_URL}/rest/v1/resumes?id=eq.${data.resumeId}`,
      JSON.stringify({
        updated_at: new Date().toISOString(),
      }),
      { headers }
    );

    check(patchRes, {
      "PATCH resumes: статус 204": (r) => r.status === 204,
      "PATCH resumes: время ответа менее 1500 мс": (r) =>
        r.timings.duration < 1500,
    });
  });

  sleep(1);
}