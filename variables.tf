variable "environment" {
  description = "Target deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "namespace" {
  description = "Kubernetes namespace for the Tuckin platform"
  type        = string
  default     = "tuckin-platform"
}

variable "release_name" {
  description = "Helm release name"
  type        = string
  default     = "tuckin"
}

variable "chart_path" {
  description = "Local filesystem path to the Tuckin Helm chart"
  type        = string
  default     = "../helm/tuckin"
}

variable "chart_repository" {
  description = "Remote Helm chart repository if not using local chart"
  type        = string
  default     = null
}

variable "chart_version" {
  description = "Version of the chart to install"
  type        = string
  default     = "0.1.0"
}

variable "values_file" {
  description = "Path to environment-specific values YAML file"
  type        = string
  default     = "../helm/tuckin/values-dev.yaml"
}

variable "kubeconfig_path" {
  description = "Path to kubeconfig file"
  type        = string
  default     = "~/.kube/config"
}
