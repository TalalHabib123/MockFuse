package gateway

import (
	"testing"

	"mockfuse/internal/contracts"
	"mockfuse/internal/events"
)

type eventRecord struct {
	name    string
	payload any
}

type stubEmitter struct {
	events []eventRecord
}

func (s *stubEmitter) Emit(name string, payload any) {
	s.events = append(s.events, eventRecord{name: name, payload: payload})
}

func TestServiceEmitsGatewayStateEvents(t *testing.T) {
	t.Parallel()

	emitter := &stubEmitter{}
	service := NewService()
	service.SetEmitter(emitter)

	response, err := service.Start(&contracts.RuntimeTarget{
		ProjectID: "project-1",
		Gateway: contracts.GatewaySettings{
			BindHost: "127.0.0.1",
			Port:     4010,
		},
	})
	if err != nil {
		t.Fatalf("Start() error = %v", err)
	}
	if response.State != contracts.GatewayStateRunning {
		t.Fatalf("Start() state = %q, want %q", response.State, contracts.GatewayStateRunning)
	}

	response, err = service.Stop()
	if err != nil {
		t.Fatalf("Stop() error = %v", err)
	}
	if response.State != contracts.GatewayStateStopped {
		t.Fatalf("Stop() state = %q, want %q", response.State, contracts.GatewayStateStopped)
	}

	if len(emitter.events) != 2 {
		t.Fatalf("event count = %d, want 2", len(emitter.events))
	}
	if emitter.events[0].name != events.GatewayStateChanged || emitter.events[1].name != events.GatewayStateChanged {
		t.Fatalf("event names = %#v", emitter.events)
	}
}
