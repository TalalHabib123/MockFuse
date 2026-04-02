package contracts

type ThemePreference string

const (
	ThemePreferenceSystem ThemePreference = "system"
	ThemePreferenceLight  ThemePreference = "light"
	ThemePreferenceDark   ThemePreference = "dark"
)

func (p ThemePreference) Valid() bool {
	switch p {
	case ThemePreferenceSystem, ThemePreferenceLight, ThemePreferenceDark:
		return true
	default:
		return false
	}
}

type AppView string

const (
	AppViewHome     AppView = "home"
	AppViewProjects AppView = "projects"
	AppViewSettings AppView = "settings"
)

func (v AppView) Valid() bool {
	switch v {
	case AppViewHome, AppViewProjects, AppViewSettings:
		return true
	default:
		return false
	}
}

type GatewaySettings struct {
	BindHost  string `json:"bindHost" yaml:"bindHost"`
	Port      uint16 `json:"port" yaml:"port"`
	AutoStart bool   `json:"autoStart" yaml:"autoStart"`
}

type Settings struct {
	SchemaVersion         uint32          `json:"schemaVersion"`
	ThemePreference       ThemePreference `json:"themePreference"`
	Gateway               GatewaySettings `json:"gateway"`
	UpstreamBaseURL       *string         `json:"upstreamBaseUrl"`
	LastActiveProjectPath *string         `json:"lastActiveProjectPath"`
	LastActiveView        *AppView        `json:"lastActiveView"`
}

type SetGatewaySettingsRequest struct {
	BindHost string `json:"bindHost"`
	Port     uint16 `json:"port"`
}
