package config

import (
	"path/filepath"
	"testing"

	"mockfuse/internal/contracts"
)

func TestStoreRoundTrip(t *testing.T) {
	t.Parallel()

	path := filepath.Join(t.TempDir(), "settings.json")
	store, err := NewStore(path)
	if err != nil {
		t.Fatalf("NewStore() error = %v", err)
	}

	if _, err := store.SetThemePreference(contracts.ThemePreferenceDark); err != nil {
		t.Fatalf("SetThemePreference() error = %v", err)
	}
	if _, err := store.SetGateway(contracts.SetGatewaySettingsRequest{
		BindHost: "localhost",
		Port:     4020,
	}); err != nil {
		t.Fatalf("SetGateway() error = %v", err)
	}

	store, err = NewStore(path)
	if err != nil {
		t.Fatalf("NewStore() reload error = %v", err)
	}

	got, err := store.Get()
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}

	if got.ThemePreference != contracts.ThemePreferenceDark {
		t.Fatalf("ThemePreference = %q, want %q", got.ThemePreference, contracts.ThemePreferenceDark)
	}
	if got.Gateway.BindHost != "localhost" || got.Gateway.Port != 4020 {
		t.Fatalf("Gateway = %#v, want localhost:4020", got.Gateway)
	}
}
