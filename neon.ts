import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Neon services for Warjok POS (tiny-leaf-63468583 / production).
  // Postgres is always present; Auth declared here. Realtime enabled via
  // `neon realtime enable` (CLI); Functions can be added under `functions`.
  auth: true,
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: "7d" };
    }
    // Existing branch: no changes
    return {};
  },
});
