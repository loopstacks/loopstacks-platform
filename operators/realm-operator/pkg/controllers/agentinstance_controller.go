package controllers

import (
	"context"

	"github.com/go-logr/logr"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	loopstacksv1 "github.com/loopstacks/loopstacks-platform/operator/pkg/apis/v1"
)

// AgentInstanceReconciler reconciles a AgentInstance object
type AgentInstanceReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=loopstacks.io,resources=agentinstances,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=loopstacks.io,resources=agentinstances/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=loopstacks.io,resources=agentinstances/finalizers,verbs=update

func (r *AgentInstanceReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := r.Log.WithValues("agentinstance", req.NamespacedName)
	log.Info("Reconciling AgentInstance")

	// TODO: Implement agent instance reconciliation logic
	return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *AgentInstanceReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&loopstacksv1.AgentInstance{}).
		Complete(r)
}