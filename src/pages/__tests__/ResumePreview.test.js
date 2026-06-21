import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("ResumePreview: no database writes", () => {
  const previewPath = resolve(import.meta.dirname, "../../pages/ResumePreview.jsx");
  const content = readFileSync(previewPath, "utf8");

  it("does not call supabase.from('resumes').update(...)", () => {
    // Check there is no .from("resumes").update pattern
    expect(content).not.toMatch(/\.from\(["']resumes["']\)\.update/);
  });

  it("does not call supabase.from('resumes').upsert(...)", () => {
    expect(content).not.toMatch(/\.from\(["']resumes["']\)\.upsert/);
  });

  it("does not call supabase.rpc(...)", () => {
    expect(content).not.toMatch(/\.rpc\(/);
  });

  it("template change only updates local state", () => {
    // handleTemplateChange should only call setSelectedTemplate and setResume
    const handlerMatch = content.match(/handleTemplateChange[\s\S]*?setSelectedTemplate[\s\S]*?setResume/);
    expect(handlerMatch).toBeTruthy();
    // No supabase call in the handler
    const handlerBlock = content.substring(
      content.indexOf("handleTemplateChange"),
      content.indexOf("handleExportPDF")
    );
    expect(handlerBlock).not.toMatch(/supabase/);
  });
});
