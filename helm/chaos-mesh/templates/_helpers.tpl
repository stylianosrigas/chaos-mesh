{{/* vim: set filetype=mustache: */}}

{{/*
Handle env variables.

TODO: in the future, we would like to use the k8s-like format for defining environment variables.
So the `envFollowKubernetesPattern` will become to `env`.
And the original way of writing env will be removed.
Ref: https://github.com/chaos-mesh/chaos-mesh/pull/2955.
*/}}
{{- define "chaos-mesh.helpers.listEnvVars" -}}
{{- with .envFollowKubernetesPattern }}
{{ toYaml . }}
{{- end }}
{{- range $key, $val := .env }}
- name: {{ $key | upper }}
  value: {{ $val | quote }}
{{- end }}
{{- end }}

{{/*
Expand the name of the chart.
*/}}
{{- define "chaos-mesh.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "chaos-mesh.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "chaos-mesh.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Generate basic labels */}}
{{- define "chaos-mesh.labels" -}}
helm.sh/chart: {{ include "chaos-mesh.chart" . }}
app.kubernetes.io/name: {{ template "chaos-mesh.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ template "chaos-mesh.name" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
{{- if .Values.customLabels }}
{{ toYaml .Values.customLabels }}
{{- end }}
{{- end }}

{{/*
Specify default selectors
*/}}
{{- define "chaos-mesh.selectors" -}}
app.kubernetes.io/name: {{ template "chaos-mesh.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Define the svc's name
*/}}
{{- define "chaos-mesh.svc" -}}
{{- printf "chaos-mesh-controller-manager" -}}
{{- end -}}

{{/*
Define the chaos-daemon svc's name
*/}}
{{- define "chaos-daemon.svc" -}}
{{- printf "chaos-daemon" -}}
{{- end -}}

{{/*
Define the chaos-dashboard svc's name
*/}}
{{- define "chaos-dashboard.svc" -}}
{{- printf "chaos-dashboard" -}}
{{- end -}}

{{/*
Define the secret's name of certs
*/}}
{{- define "chaos-mesh.webhook.certs" -}}
{{- printf "chaos-mesh-webhook-certs" -}}
{{- end -}}

{{- define "chaos-mesh.daemon.certs" -}}
{{- printf "chaos-mesh-daemon-certs" -}}
{{- end -}}

{{- define "chaos-mesh.daemon-client.certs" -}}
{{- printf "chaos-mesh-daemon-client-certs" -}}
{{- end -}}

{{- define "chaos-mesh.chaosd-client.certs" -}}
{{- printf "chaos-mesh-chaosd-client-certs" -}}
{{- end -}}

{{/*
Define the MutatingWebhookConfiguration's name
*/}}
{{- define "chaos-mesh.mutation" -}}
{{- printf "chaos-mesh-mutation" -}}
{{- end -}}

{{/*
Define the ValidationWebhookConfiguration's name
*/}}
{{- define "chaos-mesh.validation" -}}
{{- printf "chaos-mesh-validation" -}}
{{- end -}}

{{/*
Define the webhook's name
*/}}
{{- define "chaos-mesh.webhook" -}}
{{- printf "admission-webhook.chaos-mesh.org" -}}
{{- end -}}

{{/*Define the image for chaos-controller-manager*/}}
{{- define "chaos-controller-manager.image" -}}
{{ .Values.controllerManager.image.registry | default .Values.images.registry }}/{{ .Values.controllerManager.image.repository }}:{{ .Values.controllerManager.image.tag | default .Values.images.tag }}
{{- end -}}

{{/*Define the image for chaos-daemon*/}}
{{- define "chaos-daemon.image" -}}
{{ .Values.chaosDaemon.image.registry | default .Values.images.registry }}/{{ .Values.chaosDaemon.image.repository }}:{{ .Values.chaosDaemon.image.tag | default .Values.images.tag }}
{{- end -}}

{{/*Define the image for chaos-dashboard*/}}
{{- define "chaos-dashboard.image" -}}
{{ .Values.dashboard.image.registry | default .Values.images.registry }}/{{ .Values.dashboard.image.repository }}:{{ .Values.dashboard.image.tag | default .Values.images.tag }}
{{- end -}}

{{/*Define the image for chaos-kernel*/}}
{{- define "chaos-kernel.image" -}}
{{ .Values.bpfki.image.registry | default .Values.images.registry }}/{{ .Values.bpfki.image.repository }}:{{ .Values.bpfki.image.tag | default .Values.images.tag }}
{{- end -}}

{{/*Define the image for chaos-dlv*/}}
{{- define "chaos-dlv.image" -}}
{{ .Values.chaosDlv.image.registry | default .Values.images.registry }}/{{ .Values.chaosDlv.image.repository }}:{{ .Values.chaosDlv.image.tag | default .Values.images.tag }}
{{- end -}}
