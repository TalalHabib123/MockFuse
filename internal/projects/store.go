package projects

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"mockfuse/internal/contracts"
	"mockfuse/internal/storage"

	"gopkg.in/yaml.v3"
)

type Store struct {
	path        string
	projectsDir string
	mutex       sync.Mutex
	value       projectsFile
}

type projectsFile struct {
	SchemaVersion   uint32          `yaml:"schemaVersion"`
	ActiveProjectID *string         `yaml:"activeProjectId"`
	Projects        []projectRecord `yaml:"projects"`
}

type projectRecord struct {
	ID              string                     `yaml:"id"`
	Name            string                     `yaml:"name"`
	RootDir         string                     `yaml:"rootDir"`
	UpdatedAt       *string                    `yaml:"updatedAt"`
	Archived        bool                       `yaml:"archived"`
	RoutesCount     uint32                     `yaml:"routesCount"`
	Gateway         *contracts.GatewaySettings `yaml:"gateway"`
	UpstreamBaseURL *string                    `yaml:"upstreamBaseUrl"`
}

type projectFile struct {
	SchemaVersion   uint32                    `yaml:"schemaVersion"`
	ID              string                    `yaml:"id"`
	Name            string                    `yaml:"name"`
	Gateway         contracts.GatewaySettings `yaml:"gateway"`
	UpstreamBaseURL *string                   `yaml:"upstreamBaseUrl"`
	Routes          []map[string]any          `yaml:"routes"`
	CreatedAt       string                    `yaml:"createdAt"`
	UpdatedAt       string                    `yaml:"updatedAt"`
}

func NewStore(path string, projectsDir string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(projectsDir, 0o755); err != nil {
		return nil, err
	}

	if _, err := os.Stat(path); os.IsNotExist(err) {
		initial := projectsFile{
			SchemaVersion: 0,
			Projects:      []projectRecord{},
		}
		if err := writeProjects(path, initial); err != nil {
			return nil, err
		}
		return &Store{path: path, projectsDir: projectsDir, value: initial}, nil
	}

	bytes, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var value projectsFile
	if err := yaml.Unmarshal(bytes, &value); err != nil {
		backupPath := strings.TrimSuffix(path, filepath.Ext(path)) + ".corrupt.yaml"
		_ = os.Rename(path, backupPath)
		value = projectsFile{
			SchemaVersion: 0,
			Projects:      []projectRecord{},
		}
		if writeErr := writeProjects(path, value); writeErr != nil {
			return nil, writeErr
		}
	}

	return &Store{
		path:        path,
		projectsDir: projectsDir,
		value:       value,
	}, nil
}

func (s *Store) Overview() (contracts.ProjectsOverview, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return buildOverview(s.value), nil
}

func (s *Store) CreateProject(input contracts.CreateProjectInput) (contracts.ProjectSummary, error) {
	trimmedName := strings.TrimSpace(input.Name)
	if trimmedName == "" {
		return contracts.ProjectSummary{}, fmt.Errorf("project name is required")
	}
	if input.Port == 0 {
		return contracts.ProjectSummary{}, fmt.Errorf("port must be 1..65535")
	}
	if strings.TrimSpace(input.BindHost) == "" {
		return contracts.ProjectSummary{}, fmt.Errorf("bind host is required")
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.value.ActiveProjectID != nil && !input.ReplaceActive {
		return contracts.ProjectSummary{}, fmt.Errorf("active project exists; set replaceActive=true to replace it")
	}

	if input.ReplaceActive && s.value.ActiveProjectID != nil {
		if active := s.findProject(*s.value.ActiveProjectID); active != nil {
			stamp := nowStamp()
			active.Archived = true
			active.UpdatedAt = &stamp
		}
		s.value.ActiveProjectID = nil
	}

	projectID, err := newID()
	if err != nil {
		return contracts.ProjectSummary{}, err
	}

	projectDir := filepath.Join(s.projectsDir, projectID)
	if err := os.MkdirAll(projectDir, 0o755); err != nil {
		return contracts.ProjectSummary{}, err
	}

	stamp := nowStamp()
	projectDefinition := projectFile{
		SchemaVersion:   0,
		ID:              projectID,
		Name:            trimmedName,
		Gateway:         contracts.GatewaySettings{BindHost: input.BindHost, Port: input.Port, AutoStart: false},
		UpstreamBaseURL: input.UpstreamBaseURL,
		Routes:          []map[string]any{},
		CreatedAt:       stamp,
		UpdatedAt:       stamp,
	}

	projectBytes, err := yaml.Marshal(projectDefinition)
	if err != nil {
		return contracts.ProjectSummary{}, err
	}
	if err := storage.WriteFileAtomic(filepath.Join(projectDir, "project.yaml"), projectBytes, 0o644); err != nil {
		return contracts.ProjectSummary{}, err
	}

	record := projectRecord{
		ID:          projectID,
		Name:        trimmedName,
		RootDir:     projectDir,
		UpdatedAt:   &stamp,
		Archived:    false,
		RoutesCount: 0,
		Gateway: &contracts.GatewaySettings{
			BindHost:  input.BindHost,
			Port:      input.Port,
			AutoStart: false,
		},
		UpstreamBaseURL: input.UpstreamBaseURL,
	}

	s.value.Projects = append(s.value.Projects, record)
	s.value.ActiveProjectID = &projectID
	if err := s.saveLocked(); err != nil {
		return contracts.ProjectSummary{}, err
	}

	return record.summary(), nil
}

func (s *Store) ArchiveActive() error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.value.ActiveProjectID == nil {
		return fmt.Errorf("no active project to archive")
	}

	active := s.findProject(*s.value.ActiveProjectID)
	if active == nil {
		return fmt.Errorf("active project not found in store")
	}

	stamp := nowStamp()
	active.Archived = true
	active.UpdatedAt = &stamp
	s.value.ActiveProjectID = nil

	return s.saveLocked()
}

func (s *Store) RestoreProject(id string) (contracts.ProjectSummary, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	stamp := nowStamp()
	if s.value.ActiveProjectID != nil && *s.value.ActiveProjectID != id {
		if active := s.findProject(*s.value.ActiveProjectID); active != nil {
			active.Archived = true
			active.UpdatedAt = &stamp
		}
	}

	target := s.findProject(id)
	if target == nil {
		return contracts.ProjectSummary{}, fmt.Errorf("project to restore not found")
	}

	target.Archived = false
	target.UpdatedAt = &stamp
	s.value.ActiveProjectID = &target.ID
	if err := s.saveLocked(); err != nil {
		return contracts.ProjectSummary{}, err
	}

	return target.summary(), nil
}

func (s *Store) ActiveRuntimeTarget() (*contracts.RuntimeTarget, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.value.ActiveProjectID == nil {
		return nil, fmt.Errorf("no active project")
	}

	active := s.findProject(*s.value.ActiveProjectID)
	if active == nil || active.Archived {
		return nil, fmt.Errorf("active project not found")
	}
	if active.RoutesCount == 0 {
		return nil, fmt.Errorf("add endpoints to enable start")
	}
	if active.Gateway == nil {
		return nil, fmt.Errorf("active project is missing gateway settings")
	}

	return &contracts.RuntimeTarget{
		ProjectID: active.ID,
		Gateway:   *active.Gateway,
	}, nil
}

func (s *Store) findProject(id string) *projectRecord {
	for index := range s.value.Projects {
		if s.value.Projects[index].ID == id {
			return &s.value.Projects[index]
		}
	}
	return nil
}

func (s *Store) saveLocked() error {
	return writeProjects(s.path, s.value)
}

func writeProjects(path string, value projectsFile) error {
	bytes, err := yaml.Marshal(value)
	if err != nil {
		return err
	}
	return storage.WriteFileAtomic(path, bytes, 0o644)
}

func buildOverview(value projectsFile) contracts.ProjectsOverview {
	var active *contracts.ProjectSummary
	archived := make([]contracts.ProjectSummary, 0)

	for _, record := range value.Projects {
		summary := record.summary()
		if value.ActiveProjectID != nil && record.ID == *value.ActiveProjectID && !record.Archived {
			activeCopy := summary
			active = &activeCopy
			continue
		}
		if record.Archived {
			archived = append(archived, summary)
		}
	}

	return contracts.ProjectsOverview{
		Active:   active,
		Archived: archived,
	}
}

func (r projectRecord) summary() contracts.ProjectSummary {
	return contracts.ProjectSummary{
		ID:          r.ID,
		Name:        r.Name,
		RootDir:     r.RootDir,
		UpdatedAt:   cloneStringPointer(r.UpdatedAt),
		RoutesCount: r.RoutesCount,
	}
}

func cloneStringPointer(value *string) *string {
	if value == nil {
		return nil
	}
	next := *value
	return &next
}

func nowStamp() string {
	return strconv.FormatInt(time.Now().Unix(), 10)
}

func newID() (string, error) {
	var bytes [16]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return "", err
	}

	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80

	hexValue := hex.EncodeToString(bytes[:])
	return fmt.Sprintf(
		"%s-%s-%s-%s-%s",
		hexValue[0:8],
		hexValue[8:12],
		hexValue[12:16],
		hexValue[16:20],
		hexValue[20:32],
	), nil
}
