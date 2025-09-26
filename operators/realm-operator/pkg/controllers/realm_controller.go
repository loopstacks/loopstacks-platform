package controllers

import (
	"context"

	"github.com/go-logr/logr"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	loopstacksv1 "github.com/loopstacks/loopstacks-platform/operator/pkg/apis/v1"
)

// RealmReconciler reconciles a Realm object
type RealmReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=loopstacks.io,resources=realms,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=loopstacks.io,resources=realms/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=loopstacks.io,resources=realms/finalizers,verbs=update

func (r *RealmReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := r.Log.WithValues("realm", req.NamespacedName)
	log.Info("Reconciling Realm")

	// TODO: Implement realm reconciliation logic
	return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *RealmReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&loopstacksv1.Realm{}).
		Complete(r)
}