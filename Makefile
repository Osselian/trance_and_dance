HOSTS := localhost 127.0.0.1 ::1

# Папки, куда будем писать pem-файлы
BACKEND_CERT_DIR := backend/certs
ADMIN_CERT_DIR   := frontend/admin/certs
PONG_CERT_DIR    := frontend/pong/certs

.PHONY: all certs up

all: certs up

certs:
	@echo "→ Generating mkcert root CA (idempotent)…"
	@mkcert -install
	@echo "→ Ensuring cert dirs exist…"
	@mkdir -p $(BACKEND_CERT_DIR) $(ADMIN_CERT_DIR) $(PONG_CERT_DIR)
	@echo "→ Generating backend cert…"
	@mkcert -key-file $(BACKEND_CERT_DIR)/key.pem   -cert-file $(BACKEND_CERT_DIR)/cert.pem   $(HOSTS)
	@echo "→ Generating admin cert…"
	@mkcert -key-file $(ADMIN_CERT_DIR)/key.pem     -cert-file $(ADMIN_CERT_DIR)/cert.pem     $(HOSTS)
	@echo "→ Generating pong cert…"
	@mkcert -key-file $(PONG_CERT_DIR)/key.pem      -cert-file $(PONG_CERT_DIR)/cert.pem      $(HOSTS)

up:
	docker-compose up --build