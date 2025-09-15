package controllers

import (
	"context"

	"github.com/go-logr/logr"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	loopstacksv1 "github.com/loopstacks/loopstacks-platform/operator/pkg/apis/v1"
)

// LoopStackReconciler reconciles a LoopStack object
type LoopStackReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=loopstacks.io,resources=loopstacks,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=loopstacks.io,resources=loopstacks/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=loopstacks.io,resources=loopstacks/finalizers,verbs=update

func (r *LoopStackReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := r.Log.WithValues("loopstack", req.NamespacedName)
	log.Info("Reconciling LoopStack")

	// TODO: Implement loopstack reconciliation logic
	return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *LoopStackReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&loopstacksv1.LoopStack{}).
		Complete(r)
}