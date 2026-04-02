package storage

import (
	"os"
	"path/filepath"
	"testing"
)

func TestPrepareAppDataCopiesLegacyWhenDestinationEmpty(t *testing.T) {
	configRoot := t.TempDir()
	t.Setenv("MOCKFUSE_APPDATA_ROOT", configRoot)

	legacyRoot := filepath.Join(configRoot, "com.mockfuse.app")
	if err := os.MkdirAll(legacyRoot, 0o755); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}
	if err := os.WriteFile(filepath.Join(legacyRoot, "settings.json"), []byte(`{"schemaVersion":0}`), 0o644); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}

	paths, result, err := PrepareAppData("MockFuse", "com.mockfuse.app")
	if err != nil {
		t.Fatalf("PrepareAppData() error = %v", err)
	}

	if result.Status != MigrationStatusCopiedLegacy {
		t.Fatalf("status = %q, want %q", result.Status, MigrationStatusCopiedLegacy)
	}

	if _, err := os.Stat(filepath.Join(paths.RootPath, "settings.json")); err != nil {
		t.Fatalf("copied settings missing: %v", err)
	}
}
