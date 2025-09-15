package controllers

import (
	"context"
	"fmt"
	"time"

	"github.com/go-logr/logr"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"

	loopstacksv1 "github.com/loopstacks/loopstacks-platform/operator/pkg/apis/v1"
)

// AgentReconciler reconciles a Agent object
type AgentReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=loopstacks.io,resources=agents,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=loopstacks.io,resources=agents/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=loopstacks.io,resources=agents/finalizers,verbs=update

func (r *AgentReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := r.Log.WithValues("agent", req.NamespacedName)
	log.Info("Reconciling Agent")

	// Fetch the Agent instance
	agent := &loopstacksv1.Agent{}
	err := r.Get(ctx, req.NamespacedName, agent)
	if err != nil {
		if apierrors.IsNotFound(err) {
			log.Info("Agent resource not found. Ignoring since object must be deleted")
			return ctrl.Result{}, nil
		}
		log.Error(err, "Failed to get Agent")
		return ctrl.Result{}, err
	}

	// Add finalizer if not present
	finalizerName := "loopstacks.io/agent-finalizer"
	if agent.DeletionTimestamp == nil && !controllerutil.ContainsFinalizer(agent, finalizerName) {
		controllerutil.AddFinalizer(agent, finalizerName)
		return ctrl.Result{}, r.Update(ctx, agent)
	}

	// Handle deletion
	if agent.DeletionTimestamp != nil {
		return r.handleDeletion(ctx, agent, finalizerName)
	}

	// Reconcile the agent
	return r.reconcileAgent(ctx, agent)
}

func (r *AgentReconciler) reconcileAgent(ctx context.Context, agent *loopstacksv1.Agent) (ctrl.Result, error) {
	log := r.Log.WithValues("agent", agent.Name, "namespace", agent.Namespace)

	// Initialize status if needed
	if agent.Status.Phase == "" {
		agent.Status.Phase = "Pending"
		agent.Status.LastUpdated = metav1.NewTime(time.Now())
		if err := r.Status().Update(ctx, agent); err != nil {
			log.Error(err, "Failed to update Agent status")
			return ctrl.Result{}, err
		}
	}

	// Validate agent runtime
	if err := r.validateAgentRuntime(agent); err != nil {
		log.Error(err, "Agent runtime validation failed")
		agent.Status.Phase = "Failed"
		agent.Status.Message = err.Error()
		agent.Status.LastUpdated = metav1.NewTime(time.Now())
		if updateErr := r.Status().Update(ctx, agent); updateErr != nil {
			log.Error(updateErr, "Failed to update Agent status")
		}
		return ctrl.Result{RequeueAfter: time.Minute * 5}, nil
	}

	// Validate agent schema
	if err := r.validateAgentSchema(agent); err != nil {
		log.Error(err, "Agent schema validation failed")
		agent.Status.Phase = "Failed"
		agent.Status.Message = err.Error()
		agent.Status.LastUpdated = metav1.NewTime(time.Now())
		if updateErr := r.Status().Update(ctx, agent); updateErr != nil {
			log.Error(updateErr, "Failed to update Agent status")
		}
		return ctrl.Result{RequeueAfter: time.Minute * 5}, nil
	}

	// Count associated AgentInstances
	instanceCount, err := r.getAgentInstanceCount(ctx, agent)
	if err != nil {
		log.Error(err, "Failed to count AgentInstances")
		return ctrl.Result{}, err
	}

	// Update status to Ready
	agent.Status.Phase = "Ready"
	agent.Status.Message = "Agent is ready for deployment"
	agent.Status.Instances = instanceCount
	agent.Status.LastUpdated = metav1.NewTime(time.Now())

	if err := r.Status().Update(ctx, agent); err != nil {
		log.Error(err, "Failed to update Agent status")
		return ctrl.Result{}, err
	}

	log.Info("Agent reconciled successfully", "instances", instanceCount)
	return ctrl.Result{RequeueAfter: time.Minute * 10}, nil
}

func (r *AgentReconciler) handleDeletion(ctx context.Context, agent *loopstacksv1.Agent, finalizerName string) (ctrl.Result, error) {
	log := r.Log.WithValues("agent", agent.Name, "namespace", agent.Namespace)
	log.Info("Handling Agent deletion")

	// Check if there are any AgentInstances referencing this Agent
	instanceCount, err := r.getAgentInstanceCount(ctx, agent)
	if err != nil {
		log.Error(err, "Failed to count AgentInstances during deletion")
		return ctrl.Result{}, err
	}

	if instanceCount > 0 {
		log.Info("Cannot delete Agent, AgentInstances still exist", "count", instanceCount)
		agent.Status.Phase = "Terminating"
		agent.Status.Message = "Waiting for AgentInstances to be deleted"
		agent.Status.LastUpdated = metav1.NewTime(time.Now())
		if err := r.Status().Update(ctx, agent); err != nil {
			log.Error(err, "Failed to update Agent status")
		}
		return ctrl.Result{RequeueAfter: time.Second * 30}, nil
	}

	// Remove finalizer
	controllerutil.RemoveFinalizer(agent, finalizerName)
	if err := r.Update(ctx, agent); err != nil {
		log.Error(err, "Failed to remove finalizer")
		return ctrl.Result{}, err
	}

	log.Info("Agent deletion completed")
	return ctrl.Result{}, nil
}

func (r *AgentReconciler) validateAgentRuntime(agent *loopstacksv1.Agent) error {
	// Validate runtime image
	if agent.Spec.Runtime.Image == "" {
		return fmt.Errorf("runtime image is required")
	}

	// Validate runtime language
	supportedLanguages := []string{"typescript", "python", "go"}
	languageSupported := false
	for _, lang := range supportedLanguages {
		if agent.Spec.Runtime.Language == lang {
			languageSupported = true
			break
		}
	}
	if !languageSupported {
		return fmt.Errorf("unsupported runtime language: %s", agent.Spec.Runtime.Language)
	}

	return nil
}

func (r *AgentReconciler) validateAgentSchema(agent *loopstacksv1.Agent) error {
	// Basic validation - in a real implementation, this would validate JSON schemas
	if len(agent.Spec.Schema.Input.Raw) == 0 {
		return fmt.Errorf("input schema is required")
	}
	if len(agent.Spec.Schema.Output.Raw) == 0 {
		return fmt.Errorf("output schema is required")
	}
	return nil
}

func (r *AgentReconciler) getAgentInstanceCount(ctx context.Context, agent *loopstacksv1.Agent) (int32, error) {
	var agentInstances loopstacksv1.AgentInstanceList
	err := r.List(ctx, &agentInstances, client.InNamespace(agent.Namespace))
	if err != nil {
		return 0, err
	}

	count := int32(0)
	for _, instance := range agentInstances.Items {
		if instance.Spec.Agent == agent.Name {
			count++
		}
	}
	return count, nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *AgentReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&loopstacksv1.Agent{}).
		Complete(r)
}