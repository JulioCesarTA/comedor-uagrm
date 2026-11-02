# Comedor Universitario UAGRM — Plataforma multi-nube

Monorepo con 4 microservicios de negocio, 4 frontends, app móvil, IA/ML, automatización n8n
y despliegue en **AWS + Azure + GCP**. Especificación completa en [SPEC_COMEDOR_UAGRM.md](SPEC_COMEDOR_UAGRM.md).

## Arranque local

```bash
cp .env.example .env    # ya existe uno activo
make up                 # levanta TODO (o: docker compose up -d --build)
```

Panel central: **http://localhost:3000**

### URLs locales

| Pieza | URL |
|---|---|
| Shell (home) | http://localhost:3000 |
| Back-office Angular (GraphQL) | http://localhost:3001 |
| Portal estudiante | http://localhost:3002 |
| Inteligencia de negocio | http://localhost:3003 |
| API Gateway REST | http://localhost:8080 |
| GraphQL Gateway | http://localhost:8090 |
| menu-inventario-service | http://localhost:8081/actuator/health |
| comensales-reservas-service | http://localhost:8082/health |
| pagos-tickets-service | http://localhost:8083/health |
| ia-ml-service | http://localhost:8084/health |
| Keycloak | http://localhost:8085 (admin/admin) |
| n8n | http://localhost:5678 (admin/admin123) |

### Mapeo multi-nube

| Microservicio | Arquitectura | BD propia | Nube |
|---|---|---|---|
| menu-inventario-service (Spring Boot) | DDD | MongoDB | **AWS / EKS** |
| comensales-reservas-service (NestJS) | Clean | PostgreSQL | **Azure / AKS** |
| pagos-tickets-service (PHP) | Hexagonal | PostgreSQL | **GCP / GKE** |
| ia-ml-service (FastAPI) + saga orchestrator | Capas | lee CQRS | **AWS / EKS** |

DynamoDB (idempotencia + sagas) vive solo en AWS; Azure/GCP acceden vía API Gateway en AWS.

## Comandos útiles

```bash
make up         # arrancar todo
make down       # parar todo
make logs       # ver logs
make clean      # borrar contenedores + volúmenes
make test       # tests de los 4 servicios
make deploy-aws # desplegar a EKS (requiere kubectl config)
make deploy-azure
make deploy-gcp
```

## Probar la Saga 1 completa (reserva + pago)

```bash
curl -X POST http://localhost:8084/sagas/reservar-y-pagar \
  -H 'content-type: application/json' \
  -d '{
    "estudiante_id":"demo-1",
    "menu_id":"MENU_ID",
    "plato_id":"plato-A",
    "fecha":"2026-11-05",
    "turno":"ALMUERZO",
    "metodo_pago":"qr_bancario",
    "monto":8,
    "idempotency_key":"demo-key-1"
  }'
```

Ver estado de la saga: `GET http://localhost:8084/sagas/{sagaId}`

## Despliegue a nubes reales

1. Terraform aplica infra en cada nube:
   - `cd infra/terraform/aws && terraform apply`
   - `cd infra/terraform/azure && terraform apply`
   - `cd infra/terraform/gcp && terraform apply -var project=mi-proyecto-gcp`
2. Push a `main` dispara los workflows CD (`.github/workflows/cd-*.yml`).

Las credenciales van como **GitHub Actions secrets** (nunca en el repo):
`AWS_DEPLOY_ROLE`, `AZURE_CLIENT_ID`, `GCP_WIP`, `GCP_SA`, etc.
