package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"mockfuse/internal/contracts"
	"mockfuse/internal/storage"
)

type Store struct {
	path  string
	mutex sync.Mutex
	value contracts.Settings
}

func NewStore(path string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}

	if _, err := os.Stat(path); os.IsNotExist(err) {
		initial := defaultSettings()
		if err := writeSettings(path, initial); err != nil {
			return nil, err
		}
		return &Store{path: path, value: initial}, nil
	}

	bytes, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var value contracts.Settings
	if err := json.Unmarshal(bytes, &value); err != nil {
		backupPath := path + ".corrupt." + timestamp() + ".json"
		_ = os.Rename(path, backupPath)
		value = defaultSettings()
		if writeErr := writeSettings(path, value); writeErr != nil {
			return nil, writeErr
		}
	}

	return &Store{path: path, value: value}, nil
}

func (s *Store) Get() (contracts.Settings, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return cloneSettings(s.value), nil
}

func (s *Store) SetThemePreference(preference contracts.ThemePreference) (contracts.Settings, error) {
	if !preference.Valid() {
		return contracts.Settings{}, fmt.Errorf("invalid theme preference %q", preference)
	}

	return s.update(func(value *contracts.Settings) {
		value.ThemePreference = preference
	})
}

func (s *Store) SetGateway(request contracts.SetGatewaySettingsRequest) (contracts.Settings, error) {
	if request.BindHost == "" {
		return contracts.Settings{}, fmt.Errorf("gateway bind host is required")
	}
	if request.Port == 0 {
		return contracts.Settings{}, fmt.Errorf("gateway port must be 1..65535")
	}

	return s.update(func(value *contracts.Settings) {
		value.Gateway.BindHost = request.BindHost
		value.Gateway.Port = request.Port
	})
}

func (s *Store) SetLastActiveView(view contracts.AppView) (contracts.Settings, error) {
	if !view.Valid() {
		return contracts.Settings{}, fmt.Errorf("invalid view %q", view)
	}

	return s.update(func(value *contracts.Settings) {
		next := view
		value.LastActiveView = &next
	})
}

func (s *Store) update(mutator func(*contracts.Settings)) (contracts.Settings, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	next := cloneSettings(s.value)
	mutator(&next)
	if err := writeSettings(s.path, next); err != nil {
		return contracts.Settings{}, err
	}

	s.value = next
	return cloneSettings(next), nil
}

func defaultSettings() contracts.Settings {
	view := contracts.AppViewHome
	return contracts.Settings{
		SchemaVersion:   0,
		ThemePreference: contracts.ThemePreferenceSystem,
		Gateway: contracts.GatewaySettings{
			BindHost:  "127.0.0.1",
			Port:      4010,
			AutoStart: false,
		},
		LastActiveView: &view,
	}
}

func cloneSettings(value contracts.Settings) contracts.Settings {
	next := value
	if value.UpstreamBaseURL != nil {
		upstream := *value.UpstreamBaseURL
		next.UpstreamBaseURL = &upstream
	}
	if value.LastActiveProjectPath != nil {
		path := *value.LastActiveProjectPath
		next.LastActiveProjectPath = &path
	}
	if value.LastActiveView != nil {
		view := *value.LastActiveView
		next.LastActiveView = &view
	}
	return next
}

func writeSettings(path string, value contracts.Settings) error {
	bytes, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}

	return storage.WriteFileAtomic(path, bytes, 0o644)
}

func timestamp() string {
	return strconv.FormatInt(time.Now().Unix(), 10)
}
