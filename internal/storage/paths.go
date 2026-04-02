package storage

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
)

type Paths struct {
	RootPath     string
	SettingsPath string
	ProjectsPath string
	ProjectsDir  string
}

type MigrationStatus string

const (
	MigrationStatusNotNeeded       MigrationStatus = "not_needed"
	MigrationStatusCopiedLegacy    MigrationStatus = "copied_legacy"
	MigrationStatusUsingExisting   MigrationStatus = "using_existing"
	MigrationStatusLegacyMissing   MigrationStatus = "legacy_missing"
	MigrationStatusSkippedConflict MigrationStatus = "skipped_conflict"
)

type MigrationResult struct {
	Status          MigrationStatus
	LegacySource    string
	DestinationRoot string
}

func PrepareAppData(appName, legacyIdentifier string) (Paths, MigrationResult, error) {
	currentRoot, err := currentRoot(appName)
	if err != nil {
		return Paths{}, MigrationResult{}, err
	}

	if err := os.MkdirAll(currentRoot, 0o755); err != nil {
		return Paths{}, MigrationResult{}, err
	}

	currentHasEntries, err := DirHasEntries(currentRoot)
	if err != nil {
		return Paths{}, MigrationResult{}, err
	}

	legacyRoot, legacyHasEntries, err := firstLegacyRoot(legacyIdentifier)
	if err != nil {
		return Paths{}, MigrationResult{}, err
	}

	result := MigrationResult{
		DestinationRoot: currentRoot,
	}

	if currentHasEntries {
		result.Status = MigrationStatusUsingExisting
		if legacyHasEntries {
			result.Status = MigrationStatusSkippedConflict
			result.LegacySource = legacyRoot
		}
		return buildPaths(currentRoot), result, nil
	}

	if !legacyHasEntries {
		result.Status = MigrationStatusLegacyMissing
		return buildPaths(currentRoot), result, nil
	}

	if err := CopyDir(legacyRoot, currentRoot); err != nil {
		return Paths{}, MigrationResult{}, fmt.Errorf("copy legacy app data: %w", err)
	}

	result.Status = MigrationStatusCopiedLegacy
	result.LegacySource = legacyRoot
	return buildPaths(currentRoot), result, nil
}

func buildPaths(root string) Paths {
	return Paths{
		RootPath:     root,
		SettingsPath: filepath.Join(root, "settings.json"),
		ProjectsPath: filepath.Join(root, "projects.yaml"),
		ProjectsDir:  filepath.Join(root, "projects"),
	}
}

func currentRoot(appName string) (string, error) {
	if overrideRoot := os.Getenv("MOCKFUSE_APPDATA_ROOT"); overrideRoot != "" {
		return filepath.Join(overrideRoot, appName), nil
	}

	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("resolve user config dir: %w", err)
	}

	return filepath.Join(configDir, appName), nil
}

func legacyRoots(identifier string) ([]string, error) {
	if overrideRoot := os.Getenv("MOCKFUSE_APPDATA_ROOT"); overrideRoot != "" {
		return []string{filepath.Join(overrideRoot, identifier)}, nil
	}

	configDir, err := os.UserConfigDir()
	if err != nil {
		return nil, fmt.Errorf("resolve user config dir: %w", err)
	}

	roots := []string{
		filepath.Join(configDir, identifier),
	}

	if runtime.GOOS == "linux" {
		dataHome := os.Getenv("XDG_DATA_HOME")
		if dataHome == "" {
			home, err := os.UserHomeDir()
			if err == nil {
				dataHome = filepath.Join(home, ".local", "share")
			}
		}
		if dataHome != "" {
			roots = append(roots, filepath.Join(dataHome, identifier))
		}
	}

	seen := map[string]struct{}{}
	unique := make([]string, 0, len(roots))
	for _, root := range roots {
		if _, ok := seen[root]; ok {
			continue
		}
		seen[root] = struct{}{}
		unique = append(unique, root)
	}

	return unique, nil
}

func firstLegacyRoot(identifier string) (string, bool, error) {
	candidates, err := legacyRoots(identifier)
	if err != nil {
		return "", false, err
	}

	for _, candidate := range candidates {
		hasEntries, err := DirHasEntries(candidate)
		if err != nil {
			return "", false, err
		}
		if hasEntries {
			return candidate, true, nil
		}
	}

	if len(candidates) == 0 {
		return "", false, nil
	}

	return candidates[0], false, nil
}
