package projects

import (
	"path/filepath"
	"testing"

	"mockfuse/internal/contracts"
)

func TestCreateArchiveRestoreProject(t *testing.T) {
	t.Parallel()

	root := t.TempDir()
	store, err := NewStore(filepath.Join(root, "projects.yaml"), filepath.Join(root, "projects"))
	if err != nil {
		t.Fatalf("NewStore() error = %v", err)
	}

	first, err := store.CreateProject(contracts.CreateProjectInput{
		Name:     "First",
		BindHost: "127.0.0.1",
		Port:     4010,
	})
	if err != nil {
		t.Fatalf("CreateProject() error = %v", err)
	}

	overview, err := store.Overview()
	if err != nil {
		t.Fatalf("Overview() error = %v", err)
	}
	if overview.Active == nil || overview.Active.ID != first.ID {
		t.Fatalf("active project = %#v, want %q", overview.Active, first.ID)
	}

	if err := store.ArchiveActive(); err != nil {
		t.Fatalf("ArchiveActive() error = %v", err)
	}

	overview, err = store.Overview()
	if err != nil {
		t.Fatalf("Overview() after archive error = %v", err)
	}
	if overview.Active != nil {
		t.Fatalf("active project after archive = %#v, want nil", overview.Active)
	}
	if len(overview.Archived) != 1 {
		t.Fatalf("archived count = %d, want 1", len(overview.Archived))
	}

	restored, err := store.RestoreProject(first.ID)
	if err != nil {
		t.Fatalf("RestoreProject() error = %v", err)
	}
	if restored.ID != first.ID {
		t.Fatalf("restored ID = %q, want %q", restored.ID, first.ID)
	}
}
