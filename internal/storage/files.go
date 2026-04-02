package storage

import (
	"errors"
	"io"
	"io/fs"
	"os"
	"path/filepath"
)

func WriteFileAtomic(path string, contents []byte, perm fs.FileMode) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}

	tempFile, err := os.CreateTemp(filepath.Dir(path), filepath.Base(path)+".tmp-*")
	if err != nil {
		return err
	}

	tempPath := tempFile.Name()
	keepTemp := true
	defer func() {
		if keepTemp {
			_ = os.Remove(tempPath)
		}
	}()

	if _, err := tempFile.Write(contents); err != nil {
		_ = tempFile.Close()
		return err
	}

	if err := tempFile.Chmod(perm); err != nil && !errors.Is(err, fs.ErrPermission) {
		_ = tempFile.Close()
		return err
	}

	if err := tempFile.Close(); err != nil {
		return err
	}

	_ = os.Remove(path)
	if err := os.Rename(tempPath, path); err != nil {
		return err
	}

	keepTemp = false
	return nil
}

func CopyDir(sourceRoot, destinationRoot string) error {
	return filepath.WalkDir(sourceRoot, func(current string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}

		relativePath, err := filepath.Rel(sourceRoot, current)
		if err != nil {
			return err
		}

		targetPath := filepath.Join(destinationRoot, relativePath)
		if entry.IsDir() {
			return os.MkdirAll(targetPath, 0o755)
		}

		info, err := entry.Info()
		if err != nil {
			return err
		}

		return copyFile(current, targetPath, info.Mode())
	})
}

func copyFile(sourcePath, destinationPath string, mode fs.FileMode) error {
	if err := os.MkdirAll(filepath.Dir(destinationPath), 0o755); err != nil {
		return err
	}

	sourceFile, err := os.Open(sourcePath)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destinationFile, err := os.OpenFile(destinationPath, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, mode)
	if err != nil {
		return err
	}
	defer destinationFile.Close()

	if _, err := io.Copy(destinationFile, sourceFile); err != nil {
		return err
	}

	return nil
}

func DirHasEntries(path string) (bool, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return false, nil
		}
		return false, err
	}

	return len(entries) > 0, nil
}
