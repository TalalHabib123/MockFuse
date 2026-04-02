package platform

import (
	"fmt"
	"os/exec"
	"runtime"
)

type Opener struct{}

func NewOpener() *Opener {
	return &Opener{}
}

func (o *Opener) Open(path string) error {
	if path == "" {
		return fmt.Errorf("path is required")
	}

	command, args, err := openCommand(path)
	if err != nil {
		return err
	}

	if err := exec.Command(command, args...).Start(); err != nil {
		return fmt.Errorf("open path %q: %w", path, err)
	}
	return nil
}

func openCommand(path string) (string, []string, error) {
	switch runtime.GOOS {
	case "windows":
		return "explorer", []string{path}, nil
	case "darwin":
		return "open", []string{path}, nil
	case "linux":
		return "xdg-open", []string{path}, nil
	default:
		return "", nil, fmt.Errorf("open path is unsupported on %s", runtime.GOOS)
	}
}
