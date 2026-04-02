package gateway

import (
	"fmt"
	"sync"

	"mockfuse/internal/contracts"
	"mockfuse/internal/events"
)

type EventEmitter interface {
	Emit(name string, payload any)
}

type Service struct {
	mutex   sync.Mutex
	state   contracts.GatewayStateResponse
	emitter EventEmitter
}

func NewService() *Service {
	return &Service{
		state: contracts.GatewayStateResponse{
			State: contracts.GatewayStateStopped,
		},
	}
}

func (s *Service) SetEmitter(emitter EventEmitter) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.emitter = emitter
}

func (s *Service) State() contracts.GatewayStateResponse {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.state
}

func (s *Service) Start(target *contracts.RuntimeTarget) (contracts.GatewayStateResponse, error) {
	if target == nil {
		return contracts.GatewayStateResponse{}, fmt.Errorf("runtime target is required")
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.state.State == contracts.GatewayStateRunning {
		return contracts.GatewayStateResponse{}, fmt.Errorf("gateway already running")
	}

	s.state = contracts.GatewayStateResponse{
		State:     contracts.GatewayStateRunning,
		ProjectID: target.ProjectID,
	}
	s.emitLocked(contracts.GatewayStateChangedEvent{
		State:     s.state.State,
		ProjectID: target.ProjectID,
	})
	return s.state, nil
}

func (s *Service) Stop() (contracts.GatewayStateResponse, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.state.State != contracts.GatewayStateRunning {
		s.state = contracts.GatewayStateResponse{
			State: contracts.GatewayStateStopped,
		}
		return s.state, nil
	}

	s.state = contracts.GatewayStateResponse{
		State: contracts.GatewayStateStopped,
	}
	s.emitLocked(contracts.GatewayStateChangedEvent{
		State: contracts.GatewayStateStopped,
	})
	return s.state, nil
}

func (s *Service) Shutdown() {
	_, _ = s.Stop()
}

func (s *Service) emitLocked(payload contracts.GatewayStateChangedEvent) {
	if s.emitter == nil {
		return
	}
	s.emitter.Emit(events.GatewayStateChanged, payload)
}
