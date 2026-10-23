output "namespace" {
  description = "Deployed Kubernetes namespace"
  value       = kubernetes_namespace.tuckin.metadata[0].name
}

output "helm_release_name" {
  description = "Helm release name"
  value       = helm_release.tuckin.name
}

output "helm_release_status" {
  description = "Status of the deployed Helm release"
  value       = helm_release.tuckin.status
}
