package v1

import (
	"k8s.io/apimachinery/pkg/runtime/schema"
	"sigs.k8s.io/controller-runtime/pkg/scheme"
)

const (
	// GroupName is the group name used in this package
	GroupName = "loopstacks.io"
	// GroupVersion is the version used in this package
	GroupVersion = "v1"
)

var (
	// GroupVersionKind is the GroupVersionKind for this package
	GroupVersionKind = schema.GroupVersion{Group: GroupName, Version: GroupVersion}

	// SchemeBuilder is used to add go types to the GroupVersionKind scheme
	SchemeBuilder = &scheme.Builder{GroupVersion: GroupVersionKind}

	// AddToScheme adds the types in this group-version to the given scheme.
	AddToScheme = SchemeBuilder.AddToScheme
)