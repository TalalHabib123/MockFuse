package contracts

type GatewayStateChangedEvent struct {
	State     GatewayState `json:"state"`
	ProjectID string       `json:"projectId,omitempty"`
}

type SystemErrorEvent struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type HealthResponse struct {
	Status string `json:"status"`
}
