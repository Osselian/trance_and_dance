
HOSTS := localhost 127.0.0.1 ::1 backend frontend-admin frontend-pong grafana prometheus elasticsearch logstash


# Папки, куда будем писать pem-файлы
BACKEND_CERT_DIR := backend/certs
ADMIN_CERT_DIR   := frontend/admin/certs
PONG_CERT_DIR    := frontend/pong/certs
GRAFANA_CERT_DIR := devops/monitoring/grafana/certs
PROMETHEUS_CERT_DIR := devops/monitoring/prometheus/certs

.PHONY: all certs up

all: certs up

certs:
	@echo "→ Generating mkcert root CA (idempotent)…"
	@mkcert -install
	@echo "→ Ensuring cert dirs exist…"
	@mkdir -p $(BACKEND_CERT_DIR) $(ADMIN_CERT_DIR) $(PONG_CERT_DIR) $(GRAFANA_CERT_DIR) $(PROMETHEUS_CERT_DIR)
	@echo "→ Generating backend cert…"
	@mkcert -key-file $(BACKEND_CERT_DIR)/key.pem   		-cert-file $(BACKEND_CERT_DIR)/cert.pem   		 $(HOSTS)
	@echo "→ Generating admin cert…"
	@mkcert -key-file $(ADMIN_CERT_DIR)/key.pem     		-cert-file $(ADMIN_CERT_DIR)/cert.pem     		 $(HOSTS)
	@echo "→ Generating pong cert…"
	@mkcert -key-file $(PONG_CERT_DIR)/key.pem      		-cert-file $(PONG_CERT_DIR)/cert.pem      		 $(HOSTS)
	@echo "→ Generating grafana cert…"
	@mkcert -key-file $(GRAFANA_CERT_DIR)/grafana.key 		-cert-file $(GRAFANA_CERT_DIR)/grafana.crt 		 $(HOSTS)
	@chmod 644 $(GRAFANA_CERT_DIR)/*.key || true
	@echo "→ Generating prometheus cert…"
	@mkcert -key-file $(PROMETHEUS_CERT_DIR)/prometheus.key -cert-file $(PROMETHEUS_CERT_DIR)/prometheus.crt $(HOSTS)
	@chmod 644 $(PROMETHEUS_CERT_DIR)/*.key || true
up:
	docker-compose -f docker-compose.yml -f docker-compose.elk.yml up --build
down:
	docker-compose -f docker-compose.yml -f docker-compose.elk.yml down
down-volumes:
	docker-compose -f docker-compose.yml -f docker-compose.elk.yml down -v