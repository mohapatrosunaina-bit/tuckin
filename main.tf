terraform {
  required_version = ">= 1.5.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.35"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.17"
    }
  }
}

provider "kubernetes" {
  config_path = var.kubeconfig_path
}

provider "helm" {
  kubernetes {
    config_path = var.kubeconfig_path
  }
}

resource "kubernetes_namespace" "tuckin" {
  metadata {
    name = var.namespace
    labels = {
      environment = var.environment
      managed_by  = "terraform"
    }
  }
}

resource "helm_release" "tuckin" {
  name       = var.release_name
  repository = var.chart_repository
  chart      = var.chart_path
  namespace  = kubernetes_namespace.tuckin.metadata[0].name
  version    = var.chart_version

  values = [
    file(var.values_file)
  ]

  set {
    name  = "global.environment"
    value = var.environment
  }
}
