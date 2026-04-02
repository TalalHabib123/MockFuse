package contracts

type GatewayState string

const (
	GatewayStatePending GatewayState = "pending"
	GatewayStateRunning GatewayState = "running"
	GatewayStateStopped GatewayState = "stopped"
)

type GatewayStateResponse struct {
	State     GatewayState `json:"state"`
	ProjectID string       `json:"projectId,omitempty"`
}
