# Legal Boost for declaredOnly Skills — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make declaredOnly skills in the Job Match results interactive — each skill chip opens a Popover with safe, evidence-based guidance on how to legitimately boost the Evidence Score.

**Architecture:** Pure helper function `buildDeclaredSkillTip()` in `coverLetterSafetyUtils.js` returns structured tip data. A new `DeclaredSkillTipPopover` component in `src/components/ResumeBuilder/` renders the Popover. JobMatchTab.jsx replaces the static Tooltip+Chip with a clickable Chip that opens the Popover.

**Tech Stack:** React 18, MUI 5 (Popover, Typography, Alert, Chip, Button, Stack, Box), Vitest

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/utils/coverLetterSafetyUtils.js` | Modify (append) | Add `buildDeclaredSkillTip()` pure helper |
| `src/utils/tests/coverLetterSafety.test.js` | Modify (append) | Add tests for `buildDeclaredSkillTip()` |
| `src/components/ResumeBuilder/DeclaredSkillTipPopover.jsx` | Create | Popover UI component for declaredOnly tips |
| `src/components/ResumeBuilder/JobMatchTab.jsx` | Modify | Import + use Popover, replace Tooltip chips |

---

## Task 1: Write `buildDeclaredSkillTip()` helper

**Covers:** Spec sections 4, 5, 8, 9

**Files:**
- Modify: `src/utils/coverLetterSafetyUtils.js:553` (append before last closing)

- [ ] **Step 1: Write failing tests**

```javascript
// In src/utils/tests/coverLetterSafety.test.js, append:

import { buildDeclaredSkillTip } from "../coverLetterSafetyUtils";

describe("buildDeclaredSkillTip", () => {
  it("returns structured tip for PostgreSQL", () => {
    const tip = buildDeclaredSkillTip("postgresql");
    expect(tip).toHaveProperty("title");
    expect(tip).toHaveProperty("description");
    expect(tip).toHaveProperty("safeActions");
    expect(tip).toHaveProperty("avoid");
    expect(tip).toHaveProperty("targetSuggestions");
    expect(tip.title).toContain("PostgreSQL");
    expect(tip.description.length).toBeGreaterThan(20);
    expect(tip.safeActions.length).toBeGreaterThan(0);
    expect(tip.avoid.length).toBeGreaterThan(0);
    expect(tip.targetSuggestions.length).toBeGreaterThan(0);
  });

  it("PostgreSQL tip does not claim experience", () => {
    const tip = buildDeclaredSkillTip("postgresql");
    const allText = [tip.description, ...tip.safeActions, ...tip.avoid].join(" ").toLowerCase();
    expect(allText).not.toContain("у вас есть опыт");
    expect(allText).not.toContain("работали с");
    expect(allText).not.toContain("коммерческий опыт");
  });

  it("Docker tip mentions project/description, not commercial experience", () => {
    const tip = buildDeclaredSkillTip("docker");
    const allText = [tip.description, ...tip.safeActions].join(" ").toLowerCase();
    expect(allText).toContain("проект");
    expect(allText).not.toContain("коммерческий");
  });

  it("returns safe fallback for empty keyword", () => {
    const tip = buildDeclaredSkillTip("");
    expect(tip.title).toBeTruthy();
    expect(tip.description).toBeTruthy();
    expect(tip.safeActions.length).toBeGreaterThan(0);
  });

  it("returns safe fallback for unknown keyword", () => {
    const tip = buildDeclaredSkillTip("CustomTech123");
    expect(tip.title).toBeTruthy();
    expect(tip.description).toBeTruthy();
  });

  it("missing keyword should not be processed as declaredOnly", () => {
    // This tests the caller pattern, not the helper itself
    const tip = buildDeclaredSkillTip("python");
    expect(tip.title).toContain("Python");
    expect(tip.description).not.toContain("отсутствует");
  });

  it("tips do not contain banned phrases", () => {
    const banned = [
      "просто добавьте",
      "у вас есть опыт",
      "работали с",
      "коммерческий опыт",
    ];
    const keywords = ["postgresql", "docker", "python", "javascript", "ci/cd", "react"];
    for (const kw of keywords) {
      const tip = buildDeclaredSkillTip(kw);
      const allText = [tip.description, ...tip.safeActions, ...tip.avoid].join(" ").toLowerCase();
      for (const phrase of banned) {
        expect(allText).not.toContain(phrase);
      }
    }
  });

  it("targetSuggestions include experience and projects tabs", () => {
    const tip = buildDeclaredSkillTip("docker");
    const tabs = tip.targetSuggestions.map((s) => s.tab);
    expect(tabs).toContain(3); // experience tab
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/tests/coverLetterSafety.test.js --reporter=verbose 2>&1 | tail -30`
Expected: FAIL — `buildDeclaredSkillTip is not exported`

- [ ] **Step 3: Implement `buildDeclaredSkillTip()`**

In `src/utils/coverLetterSafetyUtils.js`, append before the final empty line:

```javascript
// ── Declared-skill boost tips ─────────────────────────────────────

const DECLARED_SKILL_TIPS = {
  postgresql: {
    description:
      "PostgreSQL указан в навыках, но не найден в опыте или проектах. Если вы реально использовали PostgreSQL, добавьте его в описание проекта или опыта: укажите, где он применялся, какие данные хранились, какие запросы или схему вы проектировали.",
    safeActions: [
      "Добавьте PostgreSQL в описание проекта, где он реально использовался",
      "Укажите тип задач: проектирование схем, написание запросов, оптимизация",
      "Если PostgreSQL был в个工作е — добавьте в опыт работы с описанием контекста",
    ],
    avoid: [
      "Не добавляйте PostgreSQL в навыки уровня 4–5, если не уверены",
      "Не пишите «опыт работы с PostgreSQL», если он только в списке навыков",
    ],
  },
  docker: {
    description:
      "Docker указан в навыках, но не подтверждён опытом или проектами. Если вы реально контейнеризировали приложение, добавьте это в описание проекта: Dockerfile, docker-compose, запуск сервисов, деплой или локальное окружение.",
    safeActions: [
      "Добавьте Docker в описание проекта: что контейнеризировали, зачем",
      "Укажите Dockerfile, docker-compose, или описание инфраструктуры",
      "Если Docker был в个工作е — опишите процесс деплоя или настройки окружения",
    ],
    avoid: [
      "Не пишите «контейнеризация microservices», если не делали этого",
      "Не добавляйте Docker в основной стек без реального проекта",
    ],
  },
  python: {
    description:
      "Python указан в навыках, но не найден в описании опыта или проектов. Если у вас был реальный проект на Python, добавьте его в проекты/GitHub и кратко опишите задачу, библиотеку или результат.",
    safeActions: [
      "Добавьте Python-проект в GitHub-проекты с описанием задачи",
      "Укажите библиотеки или фреймворки, которые использовали",
      "Опишите результат: что делает скрипт, какой объём данных обрабатывает",
    ],
    avoid: [
      "Не пишите «разработка на Python», если это был одноразовый скрипт",
      "Не добавляйте Python в основной стек, если работали с ним эпизодически",
    ],
  },
  javascript: {
    description:
      "JavaScript указан в навыках, но не подтверждён описанием опыта или проектов. Если он использовался в проекте, добавьте его в стек проекта или описание интерфейсных задач.",
    safeActions: [
      "Добавьте JavaScript в описание проекта, где он реально использовался",
      "Укажите контекст: фронтенд, скрипты, серверная логика на Node.js",
      "Если был в个工作е — опишите конкретные задачи",
    ],
    avoid: [
      "Не пишите «опыт с JavaScript», если он только в списке навыков",
    ],
  },
  html: {
    description:
      "HTML указан в навыках, но не подтверждён опытом. Если вы верстали страницы или работали с разметкой, добавьте это в описание проекта или опыта.",
    safeActions: [
      "Добавьте HTML в описание проекта с вёрсткой",
      "Укажите контекст: адаптивная вёрстка, email-шаблоны, статические страницы",
    ],
    avoid: [
      "Не выделяйте HTML как отдельный навык, если он используется вместе с CSS/JS",
    ],
  },
  css: {
    description:
      "CSS указан в навыках, но не подтверждён опытом. Если вы стилизовали интерфейсы, добавьте это в описание проекта: фреймворки, адаптивность, анимации.",
    safeActions: [
      "Добавьте CSS в описание проекта с конкретными задачами",
      "Укажите подход: Tailwind, SCSS, CSS-in-JS, BEM",
    ],
    avoid: [
      "Не пишите «expert CSS», если не уверены в уровне",
    ],
  },
  "ci/cd": {
    description:
      "CI/CD указан в навыках, но не подтверждён. Если вы настраивали pipeline, добавьте GitHub Actions, GitLab CI или описание процесса сборки/деплоя в опыт или проект.",
    safeActions: [
      "Добавьте CI/CD в описание проекта: какой pipeline, что делает",
      "Укажите инструмент: GitHub Actions, GitLab CI, Jenkins",
      "Опишите результат: автоматический деплой, тесты на каждый PR",
    ],
    avoid: [
      "Не пишите «настройка CI/CD для production», если делали только локально",
    ],
  },
  react: {
    description:
      "React указан в навыках, но не подтверждён описанием опыта или проектов. Если вы разрабатывали интерфейсы на React, добавьте это в описание проекта или опыта.",
    safeActions: [
      "Добавьте React в описание проекта с конкретными задачами",
      "Укажите контекст: SPA, компоненты, хуки, интеграция с API",
    ],
    avoid: [
      "Не пишите «опыт с React», если он только в списке навыков",
    ],
  },
  git: {
    description:
      "Git указан в навыках, но не подтверждён опытом. Если вы использовали Git в проекте, упомяните это в описании: ветвление, pull requests, совместная работа.",
    safeActions: [
      "Упомяните Git в описании проекта как инструмент работы",
      "Если использовали GitHub/GitLab — добавьте ссылку на профиль",
    ],
    avoid: [
      "Не выделяйте Git как отдельный навык, если он используется в каждом проекте",
    ],
  },
  "rest api": {
    description:
      "REST API указан в навыках, но не подтверждён опытом. Если вы интегрировались с API, добавьте это в описание проекта: какие API, авторизация, формат данных.",
    safeActions: [
      "Добавьте REST API в описание проекта с контекстом интеграции",
      "Укажите: какие эндпоинты, авторизация (JWT, OAuth), формат (JSON)",
    ],
    avoid: [
      "Не пишите «разработка REST API», если только потребляли чужие",
    ],
  },
  gitlab: {
    description:
      "GitLab указан в навыках, но не подтверждён опытом. Если вы использовали GitLab в проекте, упомяните это в описании: репозитории, CI/CD, code review.",
    safeActions: [
      "Упомяните GitLab в описании проекта как платформу",
      "Если настраивали GitLab CI — добавьте в описание pipeline",
    ],
    avoid: [
      "Не пишите «работа с GitLab», если только хранили код",
    ],
  },
};

const DEFAULT_DECLARED_TIP = {
  description:
    "Этот навык указан в списке навыков, но не подтверждён опытом или проектами. Если он реально использовался — добавьте его в описание проекта или опыта с конкретным контекстом.",
  safeActions: [
    "Добавьте навык в описание проекта, где он реально применялся",
    "Укажите контекст: какую задачу решали, какой результат получили",
    "Если был в个工作е — опишите конкретные задачи с этим навыком",
  ],
  avoid: [
    "Не добавляйте навык как опыт, если он только в списке навыков",
    "Не пишите «опыт работы с X», если не уверены в уровне",
  ],
};

/**
 * Returns a safe, structured tip for a declaredOnly keyword.
 * The tip explains how to legitimately boost evidence without fabricating experience.
 *
 * @param {string} keyword - The keyword from declaredOnly array (lowercase)
 * @returns {{ title: string, description: string, safeActions: string[], avoid: string[], targetSuggestions: Array<{tab: number, label: string}> }}
 */
export function buildDeclaredSkillTip(keyword) {
  const normalized = String(keyword || "").toLowerCase().trim();
  const displayName = formatKeywordName(keyword);

  const specific = DECLARED_SKILL_TIPS[normalized] || DEFAULT_DECLARED_TIP;

  const targetSuggestions = [
    { tab: 3, label: "Опыт работы", targetId: "experience-description" },
    { tab: 4, label: "GitHub-проекты", targetId: "github-username" },
  ];

  return {
    title: `${displayName} — как подтвердить`,
    description: specific.description,
    safeActions: specific.safeActions,
    avoid: specific.avoid,
    targetSuggestions,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/tests/coverLetterSafety.test.js --reporter=verbose 2>&1 | tail -30`
Expected: All tests PASS, including the new `buildDeclaredSkillTip` suite.

- [ ] **Step 5: Commit**

```bash
git add src/utils/coverLetterSafetyUtils.js src/utils/tests/coverLetterSafety.test.js
git commit -m "feat: add buildDeclaredSkillTip helper for declaredOnly boost tips"
```

---

## Task 2: Create `DeclaredSkillTipPopover` component

**Covers:** Spec sections 3, 6, 7, 8

**Files:**
- Create: `src/components/ResumeBuilder/DeclaredSkillTipPopover.jsx`

- [ ] **Step 1: Create the component**

```jsx
// src/components/ResumeBuilder/DeclaredSkillTipPopover.jsx

import { useState } from "react";
import {
  Box,
  Typography,
  Popover,
  Alert,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { buildDeclaredSkillTip } from "../../utils/coverLetterSafetyUtils";

export default function DeclaredSkillTipPopover({
  keyword,
  onNavigateToTarget,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const tip = buildDeclaredSkillTip(keyword);

  const handleOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleNavigate = (tab, targetId) => {
    handleClose();
    if (onNavigateToTarget) {
      onNavigateToTarget(tab, targetId);
    }
  };

  return (
    <>
      <Box
        component="span"
        onClick={handleOpen}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          cursor: "pointer",
          color: "warning.main",
          ml: 0.25,
          transition: "color 150ms ease",
          "&:hover": { color: "warning.dark" },
        }}
      >
        <HelpOutlineIcon sx={{ fontSize: 16 }} />
      </Box>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              maxWidth: 420,
              p: 2.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            },
          },
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          {tip.title}
        </Typography>

        <Alert severity="info" sx={{ mb: 1.5 }}>
          {tip.description}
        </Alert>

        <Typography variant="caption" sx={{ fontWeight: 600, color: "success.main" }}>
          Как безопасно подтвердить
        </Typography>
        <Stack spacing={0.5} sx={{ mb: 1.5, mt: 0.5 }}>
          {tip.safeActions.map((action, i) => (
            <Typography key={i} variant="body2" sx={{ pl: 1.5, position: "relative" }}>
              <Box
                component="span"
                sx={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "success.main",
                }}
              />
              {action}
            </Typography>
          ))}
        </Stack>

        <Typography variant="caption" sx={{ fontWeight: 600, color: "error.main" }}>
          Чего не писать
        </Typography>
        <Stack spacing={0.5} sx={{ mb: 1.5, mt: 0.5 }}>
          {tip.avoid.map((item, i) => (
            <Typography key={i} variant="body2" color="text.secondary" sx={{ pl: 1.5, position: "relative" }}>
              <Box
                component="span"
                sx={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "error.main",
                }}
              />
              {item}
            </Typography>
          ))}
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
          Куда добавить evidence
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.5 }}>
          {tip.targetSuggestions.map((s) => (
            <Button
              key={s.tab}
              size="small"
              variant="outlined"
              onClick={() => handleNavigate(s.tab, s.targetId)}
              sx={{ textTransform: "none" }}
            >
              {s.label}
            </Button>
          ))}
        </Stack>
      </Popover>
    </>
  );
}
```

- [ ] **Step 2: Run build to verify no syntax errors**

Run: `npm run build 2>&1 | tail -10`
Expected: Build succeeds (component is not imported anywhere yet, but syntax is valid)

- [ ] **Step 3: Commit**

```bash
git add src/components/ResumeBuilder/DeclaredSkillTipPopover.jsx
git commit -m "feat: add DeclaredSkillTipPopover component"
```

---

## Task 3: Integrate Popover into JobMatchTab.jsx

**Covers:** Spec sections 1, 2, 3, 6, 7, 8

**Files:**
- Modify: `src/components/ResumeBuilder/JobMatchTab.jsx:358-372`

- [ ] **Step 1: Add import**

In `src/components/ResumeBuilder/JobMatchTab.jsx`, add to imports (after line 27):

```javascript
import DeclaredSkillTipPopover from "./DeclaredSkillTipPopover";
```

- [ ] **Step 2: Replace declaredOnly Chips**

Replace the declaredOnly block (lines 358-372) with:

```jsx
{result.totalKeywords > 0 && result.declaredOnly?.length > 0 && (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Есть только в навыках ({result.declaredOnly.length})
      </Typography>
      <Alert severity="info" sx={{ mb: 1.5 }}>
        Эти технологии есть в списке навыков, но не подтверждены опытом или проектами.
        Нажмите на{" "}
        <HelpOutlineIcon sx={{ fontSize: 14, verticalAlign: "middle" }} />{" "}
        рядом с навыком, чтобы узнать, как безопасно подтвердить.
      </Alert>
      <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
        {result.declaredOnly.map((kw) => (
          <Chip
            key={kw}
            label={getKeywordLabel(kw)}
            color="warning"
            variant="outlined"
            size="small"
            deleteIcon={<HelpOutlineIcon sx={{ fontSize: 16 }} />}
            onDelete={(e) => {
              e.stopPropagation();
            }}
            sx={{
              "& .MuiChip-deleteIcon": {
                color: "warning.main",
                "&:hover": { color: "warning.dark" },
              },
            }}
          />
        ))}
        {result.declaredOnly.map((kw) => (
          <DeclaredSkillTipPopover
            key={`tip-${kw}`}
            keyword={kw}
            onNavigateToTarget={onNavigateToTarget}
          />
        ))}
      </Stack>
    </CardContent>
  </Card>
)}
```

**Note:** The `HelpOutlineIcon` import needs to be added at the top of the file. Add it alongside the existing MUI icon imports:

```javascript
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
```

- [ ] **Step 3: Run build + lint**

Run: `npm run build 2>&1 | tail -10 && npm run lint 2>&1 | tail -10`
Expected: Both pass clean

- [ ] **Step 4: Run all tests**

Run: `npx vitest run 2>&1 | tail -20`
Expected: All tests pass (58+ tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ResumeBuilder/JobMatchTab.jsx
git commit -m "feat: make declaredOnly skills interactive with tip popover"
```

---

## Task 4: Verify end-to-end

**Covers:** Spec sections 6, 7, 10

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run 2>&1`
Expected: All tests pass, 0 failures

- [ ] **Step 2: Run lint**

Run: `npm run lint 2>&1`
Expected: No errors or warnings related to changed files

- [ ] **Step 3: Run build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Verify dev scenarios manually**

- [ ] Open dev server (`npm run dev`)
- [ ] Load dev scenario "Case A — Python backend mismatch" (has declaredOnly: PostgreSQL, SQL)
- [ ] Click help icon next to PostgreSQL chip → Popover opens with correct tip
- [ ] Click "GitHub-проекты" button in Popover → navigates to GitHub tab
- [ ] Close Popover by clicking away
- [ ] Verify Docker tip mentions "проект" not "коммерческий"
- [ ] Verify no banned phrases appear in any tip

---

## UX Flow Summary

1. User runs Job Match analysis → sees declaredOnly block with warning chips
2. Alert text explains: "нажмите на ? рядом с навыком"
3. Each chip has a small `?` icon (via `onDelete` pattern with custom icon)
4. A separate `DeclaredSkillTipPopover` is rendered next to each chip
5. Clicking `?` opens a Popover with:
   - Title: "PostgreSQL — как подтвердить"
   - Info alert: safe description of what's missing
   - "Как безопасно подтвердить" — green bullet list
   - "Чего не писать" — red bullet list
   - Divider
   - "Куда добавить evidence" — buttons for "Опыт работы" / "GitHub-проекты"
6. Clicking a navigation button closes Popover and scrolls to the target tab/field

## Texts (Russian)

| Element | Text |
|---------|------|
| Block title | Есть только в навыках (N) |
| Block alert | Эти технологии есть в списке навыков, но не подтверждены опытом или проектами. Нажмите на ? рядом с навыком, чтобы узнать, как безопасно подтвердить. |
| Popover title | {Skill} — как подтвердить |
| Safe actions header | Как безопасно подтвердить |
| Avoid header | Чего не писать |
| Navigation header | Куда добавить evidence |
| Nav button 1 | Опыт работы |
| Nav button 2 | GitHub-проекты |

## Risks

| Risk | Mitigation |
|------|-----------|
| Popover overlaps on small screens | Use `maxWidth: 420`, anchorOrigin bottom-left, transformOrigin top-left — standard MUI pattern |
| Help icon too small to notice | Use `onDelete` pattern on Chip for visibility, plus explicit Alert text |
| Tips could become outdated | Pure helper, easy to update. Specific tips for 12 common keywords + generic fallback |
| Navigation buttons may not scroll correctly | Reuses existing `onNavigateToTarget` pattern that already works in recommendations |

## What NOT to Change

- Supabase schema, migrations, RLS, RPC
- `resumeService.js`
- GitHub Import / Edge Function
- AI model config
- Cover letter generation logic
- `getCoverLetterMode` rules
- `validateCoverLetterText` / `validateJobMatchAdviceText`
- Export PDF/DOCX/Markdown
- Dev-only scenarios (`jobMatchTestCases.js`, `JobMatchScenarioPanel.jsx`)
- `package.json` dependencies (MUI Popover already available)
