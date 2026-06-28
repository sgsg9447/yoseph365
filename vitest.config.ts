import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // 워크트리 생성물은 별도 브랜치 사본이므로 테스트 수집에서 제외.
    // (레거시 .worktrees/* + 네이티브 .claude/worktrees/* 둘 다)
    exclude: [...configDefaults.exclude, "**/.worktrees/**", "**/.claude/worktrees/**"],
  },
  resolve: { alias: { "@": resolve(__dirname, "./src") } },
});
