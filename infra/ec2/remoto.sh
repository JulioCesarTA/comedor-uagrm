#!/usr/bin/env bash
# Se ejecuta EN cada EC2 (lo lanza desplegar-ec2.sh). Uso: remoto.sh <datos|negocio|web>
set -euo pipefail
ROL=${1:?falta el rol: datos | negocio | web}
cd ~/comedor
set -a; . ./.env.ec2; . ./.env; set +a
F="--env-file .env --env-file .env.secrets --env-file .env.ec2 -f docker-compose.yml -f docker-compose.ec2.yml"
SERV_DATOS="mongo postgres-comensales postgres-pagos postgres-cqrs dynamodb-local localstack keycloak"
SERV_NEGOCIO="menu-inventario-service comensales-reservas-service pagos-tickets-service ia-ml-service graphql-gateway api-gateway n8n"
SERV_WEB="shell backoffice-gestion portal-estudiante inteligencia-negocio"

esperar() { until [ "$(docker inspect -f '{{.State.Health.Status}}' $1 2>/dev/null)" = "healthy" ]; do sleep 3; done; }

if [ "$ROL" = "datos" ]; then
  echo "== [datos] bases de datos y mensajería"
  docker compose $F pull --quiet $SERV_DATOS
  docker compose $F up -d --no-deps postgres-comensales postgres-pagos postgres-cqrs dynamodb-local mongo
  for c in comedor-postgres-comensales comedor-postgres-pagos comedor-postgres-cqrs comedor-mongo; do esperar $c; done
  restaurar() {  # contenedor usuario base contraseña
    docker exec -i -e PGPASSWORD="$4" $1 pg_restore -U $2 -d $3 --no-owner --no-privileges --clean --if-exists < respaldo/$3.dump 2>&1 | tail -2 || true
    echo "   $3: $(docker exec -e PGPASSWORD="$4" $1 psql -U $2 -d $3 -Atc "select count(*) from pg_stat_user_tables") tablas"
  }
  restaurar comedor-postgres-comensales "$POSTGRES_COMENSALES_USER" "$POSTGRES_COMENSALES_DB" "$POSTGRES_COMENSALES_PASSWORD"
  restaurar comedor-postgres-pagos "$POSTGRES_PAGOS_USER" "$POSTGRES_PAGOS_DB" "$POSTGRES_PAGOS_PASSWORD"
  restaurar comedor-postgres-cqrs "$POSTGRES_CQRS_USER" "$POSTGRES_CQRS_DB" "$POSTGRES_CQRS_PASSWORD"
  if [ -f respaldo/mongo.archive.gz ]; then
    docker exec -i comedor-mongo mongorestore --archive --gzip --drop -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin < respaldo/mongo.archive.gz 2>&1 | tail -2
  fi
  chmod +x eventbus/infra/init-localstack.sh
  docker compose $F up -d --no-deps localstack keycloak
fi

if [ "$ROL" = "negocio" ]; then
  echo "== [negocio] microservicios, gateway y n8n"
  docker compose $F pull --quiet $SERV_NEGOCIO
  docker compose $F up -d --no-deps $SERV_NEGOCIO
  echo "== [negocio] DynamoDB (sagas e idempotencia)"
  sleep 25
  for t in sagas idempotency_keys; do docker cp respaldo/dynamodb-$t.json comedor-ia-ml:/tmp/dynamodb-$t.json; done
  docker cp infra/ec2/cargar_dynamodb.py comedor-ia-ml:/tmp/cargar_dynamodb.py
  docker exec comedor-ia-ml python /tmp/cargar_dynamodb.py
fi

if [ "$ROL" = "web" ]; then
  echo "== [web] nginx y certificado para $HOST"
  sudo mkdir -p /var/www/html
  sudo rm -f /etc/nginx/sites-enabled/default
  HTTP80="server { listen 80; server_name $HOST; location /.well-known/acme-challenge/ { root /var/www/html; } location / { return 301 https://\$host\$request_uri; } }"
  echo "$HTTP80" | sudo tee /etc/nginx/sites-available/comedor >/dev/null
  sudo ln -sf /etc/nginx/sites-available/comedor /etc/nginx/sites-enabled/comedor
  sudo nginx -t && sudo systemctl reload nginx
  if [ ! -f /etc/letsencrypt/live/$HOST/fullchain.pem ]; then
    sudo certbot certonly --webroot -w /var/www/html -d $HOST --non-interactive --agree-tos --register-unsafely-without-email
  fi
  printf '#!/bin/sh\nsystemctl reload nginx\n' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/recargar-nginx.sh >/dev/null
  sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/recargar-nginx.sh
  printf "map \$http_upgrade \$connection_upgrade { default upgrade; '' close; }\n" | sudo tee /etc/nginx/conf.d/websocket.conf >/dev/null
  bloque() {  # puerto público, destino host:puerto
    cat <<B
server {
  listen $1 ssl;
  server_name $HOST;
  ssl_certificate /etc/letsencrypt/live/$HOST/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/$HOST/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  client_max_body_size 25m;
  location / {
    proxy_pass http://$2;
    proxy_http_version 1.1;
    proxy_set_header Host \$http_host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-Host \$http_host;
    proxy_set_header X-Forwarded-Port \$server_port;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \$connection_upgrade;
    proxy_read_timeout 120s;
  }
}
B
  }
  {
    echo "$HTTP80"
    bloque 443 127.0.0.1:13000; bloque 3001 127.0.0.1:13001; bloque 3002 127.0.0.1:13002; bloque 3003 127.0.0.1:13003
    bloque 8080 $IP_NEGOCIO:8080; bloque 8085 $IP_DATOS:8085; bloque 5678 $IP_NEGOCIO:5678
  } | sudo tee /etc/nginx/sites-available/comedor >/dev/null
  sudo nginx -t && sudo systemctl reload nginx
  echo "== [web] frontends"
  docker compose $F pull --quiet $SERV_WEB
  docker compose $F up -d --no-deps $SERV_WEB
fi
docker ps --format 'table {{.Names}}\t{{.Status}}' | head -20
