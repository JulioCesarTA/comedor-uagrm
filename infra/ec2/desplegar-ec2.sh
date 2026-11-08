#!/usr/bin/env bash
# Despliega en las 3 EC2 (datos -> negocio -> web). Requiere crear-ec2.sh, crear-ec2-internas.sh y las imágenes ya subidas a ECR.
# Uso: set -a; . ./.env.cloud.nuevo; set +a; bash infra/ec2/desplegar-ec2.sh
set -euo pipefail
export MSYS_NO_PATHCONV=1 AWS_PAGER=""
R=us-west-2
ECR=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$R.amazonaws.com
ssh_() { ssh -i respaldo/ec2-comedor.pem -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 ubuntu@$1 "${@:2}"; }

python infra/ec2/realm.py "$EC2_HOST" deploy/ec2/realm/comedor-realm.json
if [ ! -f respaldo/env.ec2 ]; then
  {
    echo "HOST=$EC2_HOST"
    echo "ECR=$ECR/comedor"
    echo "IP_DATOS=$DATOS_PRIV"
    echo "IP_NEGOCIO=$NEGOCIO_PRIV"
    echo "KEYCLOAK_ADMIN_PASSWORD=$(python -c 'import secrets;print(secrets.token_urlsafe(12))')"
    echo "N8N_BASIC_AUTH_PASSWORD=$(python -c 'import secrets;print(secrets.token_urlsafe(12))')"
  } > respaldo/env.ec2
fi

ARCHIVOS="docker-compose.yml docker-compose.ec2.yml .env .env.secrets auth eventbus/infra automation/n8n/flows deploy/ec2/realm infra/ec2/remoto.sh infra/ec2/cargar_dynamodb.py"
RESPALDOS=$(ls respaldo/*.dump respaldo/dynamodb-*.json respaldo/mongo.archive.gz 2>/dev/null | grep -v keycloak || true)

desplegar() {  # rol ip
  echo "################ $1 ($2)"
  until ssh_ $2 'test -f /var/lib/cloud/instance/listo-comedor' 2>/dev/null; do sleep 10; done
  tar czf - $ARCHIVOS $RESPALDOS | ssh_ $2 'rm -rf ~/comedor && mkdir -p ~/comedor && tar xzf - -C ~/comedor'
  scp -i respaldo/ec2-comedor.pem respaldo/env.ec2 ubuntu@$2:comedor/.env.ec2 >/dev/null
  aws ecr get-login-password --region $R | ssh_ $2 "docker login --username AWS --password-stdin $ECR" 2>&1 | tail -1
  ssh_ $2 "bash ~/comedor/infra/ec2/remoto.sh $1"
}
desplegar datos $DATOS_IP
desplegar negocio $NEGOCIO_IP
desplegar web $EC2_IP
echo "listo: https://$EC2_HOST"
