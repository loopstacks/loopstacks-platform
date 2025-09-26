package v1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// Agent defines the specification for an AI agent
// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:scope=Namespaced,shortName=ag
// +kubebuilder:printcolumn:name="Language",type="string",JSONPath=".spec.runtime.language"
// +kubebuilder:printcolumn:name="Status",type="string",JSONPath=".status.phase"
// +kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"
type Agent struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   AgentSpec   `json:"spec,omitempty"`
	Status AgentStatus `json:"status,omitempty"`
}

// AgentSpec defines the desired state of Agent
type AgentSpec struct {
	Runtime      AgentRuntime  `json:"runtime"`
	Capabilities []string      `json:"capabilities"`
	Schema       AgentSchema   `json:"schema"`
	Metadata     AgentMetadata `json:"metadata,omitempty"`
}

// AgentRuntime defines the runtime configuration for an agent
type AgentRuntime struct {
	Image     string            `json:"image"`
	Language  string            `json:"language"`
	Resources map[string]string `json:"resources,omitempty"`
}

// AgentSchema defines the input/output schema for an agent
type AgentSchema struct {
	Input  runtime.RawExtension `json:"input"`
	Output runtime.RawExtension `json:"output"`
}

// AgentMetadata contains additional metadata about the agent
type AgentMetadata struct {
	Name        string   `json:"name,omitempty"`
	Description string   `json:"description,omitempty"`
	Version     string   `json:"version,omitempty"`
	Author      string   `json:"author,omitempty"`
	Tags        []string `json:"tags,omitempty"`
}

// AgentStatus defines the observed state of Agent
type AgentStatus struct {
	Phase       string      `json:"phase,omitempty"`
	Message     string      `json:"message,omitempty"`
	LastUpdated metav1.Time `json:"lastUpdated,omitempty"`
	Instances   int32       `json:"instances,omitempty"`
}

// AgentList contains a list of Agent
// +kubebuilder:object:root=true
type AgentList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Agent `json:"items"`
}

// Realm defines an isolated environment for agent execution
// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:scope=Namespaced,shortName=rlm
type Realm struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   RealmSpec   `json:"spec,omitempty"`
	Status RealmStatus `json:"status,omitempty"`
}

// RealmSpec defines the desired state of Realm
type RealmSpec struct {
	Description string           `json:"description"`
	Isolation   string           `json:"isolation,omitempty"`
	Resources   RealmResources   `json:"resources,omitempty"`
	Networking  RealmNetworking  `json:"networking,omitempty"`
	Governance  RealmGovernance  `json:"governance,omitempty"`
}

// RealmResources defines resource limits for a realm
type RealmResources struct {
	MaxAgentInstances   int32       `json:"maxAgentInstances,omitempty"`
	MaxConcurrentLoops  int32       `json:"maxConcurrentLoops,omitempty"`
	StorageClass        string      `json:"storageClass,omitempty"`
	RedisConfig         RedisConfig `json:"redisConfig,omitempty"`
}

// RedisConfig defines Redis configuration for a realm
type RedisConfig struct {
	Replicas int32  `json:"replicas,omitempty"`
	Memory   string `json:"memory,omitempty"`
}

// RealmNetworking defines networking configuration for a realm
type RealmNetworking struct {
	AllowCrossRealmCommunication bool     `json:"allowCrossRealmCommunication,omitempty"`
	FederationEndpoints          []string `json:"federationEndpoints,omitempty"`
}

// RealmGovernance defines governance policies for a realm
type RealmGovernance struct {
	AgentApprovalRequired bool                   `json:"agentApprovalRequired,omitempty"`
	LoopAuditingEnabled   bool                   `json:"loopAuditingEnabled,omitempty"`
	RetentionPolicy       RealmRetentionPolicy   `json:"retentionPolicy,omitempty"`
}

// RealmRetentionPolicy defines data retention policies
type RealmRetentionPolicy struct {
	LoopHistory string `json:"loopHistory,omitempty"`
	AgentLogs   string `json:"agentLogs,omitempty"`
}

// RealmStatus defines the observed state of Realm
type RealmStatus struct {
	Phase          string      `json:"phase,omitempty"`
	Message        string      `json:"message,omitempty"`
	LastUpdated    metav1.Time `json:"lastUpdated,omitempty"`
	AgentInstances int32       `json:"agentInstances,omitempty"`
	ActiveLoops    int32       `json:"activeLoops,omitempty"`
	RedisStatus    string      `json:"redisStatus,omitempty"`
}

// RealmList contains a list of Realm
// +kubebuilder:object:root=true
type RealmList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Realm `json:"items"`
}

// AgentInstance defines a running deployment of an Agent in a Realm
// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:scope=Namespaced,shortName=ai
type AgentInstance struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   AgentInstanceSpec   `json:"spec,omitempty"`
	Status AgentInstanceStatus `json:"status,omitempty"`
}

// AgentInstanceSpec defines the desired state of AgentInstance
type AgentInstanceSpec struct {
	Agent       string                     `json:"agent"`
	Realm       string                     `json:"realm"`
	Replicas    int32                      `json:"replicas,omitempty"`
	Resources   map[string]string          `json:"resources,omitempty"`
	Config      runtime.RawExtension       `json:"config,omitempty"`
	Autoscaling AgentInstanceAutoscaling   `json:"autoscaling,omitempty"`
	Placement   AgentInstancePlacement     `json:"placement,omitempty"`
}

// AgentInstanceAutoscaling defines autoscaling configuration
type AgentInstanceAutoscaling struct {
	Enabled                    bool  `json:"enabled,omitempty"`
	MinReplicas                int32 `json:"minReplicas,omitempty"`
	MaxReplicas                int32 `json:"maxReplicas,omitempty"`
	TargetCPUUtilization       int32 `json:"targetCPUUtilization,omitempty"`
	TargetMemoryUtilization    int32 `json:"targetMemoryUtilization,omitempty"`
}

// AgentInstancePlacement defines placement constraints
type AgentInstancePlacement struct {
	NodeSelector map[string]string           `json:"nodeSelector,omitempty"`
	Tolerations  []runtime.RawExtension      `json:"tolerations,omitempty"`
	Affinity     runtime.RawExtension        `json:"affinity,omitempty"`
}

// AgentInstanceStatus defines the observed state of AgentInstance
type AgentInstanceStatus struct {
	Phase           string                        `json:"phase,omitempty"`
	Message         string                        `json:"message,omitempty"`
	LastUpdated     metav1.Time                   `json:"lastUpdated,omitempty"`
	ReadyReplicas   int32                         `json:"readyReplicas,omitempty"`
	CurrentReplicas int32                         `json:"currentReplicas,omitempty"`
	Conditions      []AgentInstanceCondition      `json:"conditions,omitempty"`
}

// AgentInstanceCondition represents a condition of an AgentInstance
type AgentInstanceCondition struct {
	Type               string      `json:"type"`
	Status             string      `json:"status"`
	LastTransitionTime metav1.Time `json:"lastTransitionTime"`
	Reason             string      `json:"reason,omitempty"`
	Message            string      `json:"message,omitempty"`
}

// AgentInstanceList contains a list of AgentInstance
// +kubebuilder:object:root=true
type AgentInstanceList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []AgentInstance `json:"items"`
}

// LoopStack defines a workflow definition with phases
// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:scope=Namespaced,shortName=ls
type LoopStack struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   LoopStackSpec   `json:"spec,omitempty"`
	Status LoopStackStatus `json:"status,omitempty"`
}

// LoopStackSpec defines the desired state of LoopStack
type LoopStackSpec struct {
	Description  string                `json:"description"`
	Schema       LoopStackSchema       `json:"schema"`
	Phases       LoopStackPhases       `json:"phases,omitempty"`
	Capabilities []string              `json:"capabilities"`
	Metadata     LoopStackMetadata     `json:"metadata,omitempty"`
}

// LoopStackSchema defines input/output schema for the workflow
type LoopStackSchema struct {
	Input  runtime.RawExtension `json:"input"`
	Output runtime.RawExtension `json:"output"`
}

// LoopStackPhases defines the workflow phases
type LoopStackPhases struct {
	Intake    LoopStackIntakePhase    `json:"intake,omitempty"`
	Bidding   LoopStackBiddingPhase   `json:"bidding,omitempty"`
	Execution LoopStackExecutionPhase `json:"execution,omitempty"`
	Output    LoopStackOutputPhase    `json:"output,omitempty"`
}

// LoopStackIntakePhase defines the intake phase configuration
type LoopStackIntakePhase struct {
	Timeout    string                        `json:"timeout,omitempty"`
	Validation LoopStackIntakeValidation     `json:"validation,omitempty"`
}

// LoopStackIntakeValidation defines input validation rules
type LoopStackIntakeValidation struct {
	Required bool                 `json:"required,omitempty"`
	Schema   runtime.RawExtension `json:"schema,omitempty"`
}

// LoopStackBiddingPhase defines the bidding phase configuration
type LoopStackBiddingPhase struct {
	Timeout           string `json:"timeout,omitempty"`
	MinBids           int32  `json:"minBids,omitempty"`
	MaxBids           int32  `json:"maxBids,omitempty"`
	SelectionStrategy string `json:"selectionStrategy,omitempty"`
}

// LoopStackExecutionPhase defines the execution phase configuration
type LoopStackExecutionPhase struct {
	Timeout     string                       `json:"timeout,omitempty"`
	Parallelism string                       `json:"parallelism,omitempty"`
	RetryPolicy LoopStackExecutionRetryPolicy `json:"retryPolicy,omitempty"`
}

// LoopStackExecutionRetryPolicy defines retry behavior
type LoopStackExecutionRetryPolicy struct {
	MaxRetries       int32  `json:"maxRetries,omitempty"`
	BackoffStrategy  string `json:"backoffStrategy,omitempty"`
}

// LoopStackOutputPhase defines the output phase configuration
type LoopStackOutputPhase struct {
	Timeout              string `json:"timeout,omitempty"`
	AggregationStrategy  string `json:"aggregationStrategy,omitempty"`
}

// LoopStackMetadata contains additional metadata about the workflow
type LoopStackMetadata struct {
	Version  string   `json:"version,omitempty"`
	Author   string   `json:"author,omitempty"`
	Tags     []string `json:"tags,omitempty"`
	Category string   `json:"category,omitempty"`
}

// LoopStackStatus defines the observed state of LoopStack
type LoopStackStatus struct {
	Phase       string                    `json:"phase,omitempty"`
	Message     string                    `json:"message,omitempty"`
	LastUpdated metav1.Time               `json:"lastUpdated,omitempty"`
	Executions  LoopStackExecutionStats   `json:"executions,omitempty"`
}

// LoopStackExecutionStats tracks execution statistics
type LoopStackExecutionStats struct {
	Total           int32  `json:"total,omitempty"`
	Successful      int32  `json:"successful,omitempty"`
	Failed          int32  `json:"failed,omitempty"`
	AverageDuration string `json:"averageDuration,omitempty"`
}

// LoopStackList contains a list of LoopStack
// +kubebuilder:object:root=true
type LoopStackList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []LoopStack `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Agent{}, &AgentList{})
	SchemeBuilder.Register(&Realm{}, &RealmList{})
	SchemeBuilder.Register(&AgentInstance{}, &AgentInstanceList{})
	SchemeBuilder.Register(&LoopStack{}, &LoopStackList{})
}