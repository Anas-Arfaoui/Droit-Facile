# Droit-Facile - Sprint 1

Stories : Inscription, Authentification & roles, Journaliser les actions, Gerer dossier client, Creer une seance.

## Lancer
1. Base PostgreSQL : `docker compose up -d`  (ou `CREATE DATABASE droitfacile;` a la main)
2. Adapter user/mot de passe dans `src/main/resources/application.yml` si besoin
3. `mvn spring-boot:run`  (ou bouton Run dans l'IDE sur DroitFacileApplication)

Les tables sont creees automatiquement par Hibernate.
Compte ADMIN auto-cree : admin@droitfacile.com / Admin12345

## Endpoints
| Methode | URL | Acces |
|---|---|---|
| POST | /api/auth/register | public |
| POST | /api/auth/login | public |
| GET | /api/users/me | connecte |
| GET | /api/users/clients | AVOCAT, ADMIN |
| POST | /api/dossiers | AVOCAT |
| GET | /api/dossiers | connecte (filtre par role) |
| GET | /api/dossiers/{id} | avocat / client du dossier, ADMIN |
| PUT | /api/dossiers/{id} | avocat du dossier |
| PATCH | /api/dossiers/{id}/statut | avocat du dossier |
| POST | /api/dossiers/{id}/seances | avocat du dossier |
| GET | /api/dossiers/{id}/seances | avocat / client du dossier, ADMIN |
| GET | /api/audit | ADMIN |

## Test avec Postman
Pour les routes protegees : header `Authorization: Bearer <token>` (token renvoye par /login).

1. POST /api/auth/register `{"nom":"Sara","email":"sara@test.com","motDePasse":"Password123","role":"CLIENT"}`
2. POST /api/auth/register `{"nom":"Me Karim","email":"karim@test.com","motDePasse":"Password123","role":"AVOCAT"}`
3. POST /api/auth/login `{"email":"karim@test.com","motDePasse":"Password123"}`  -> copier le token
4. GET /api/users/clients -> noter l'id du client
5. POST /api/dossiers `{"titre":"Litige locatif","description":"...","clientId":2}`
6. POST /api/dossiers/1/seances `{"dateSeance":"2026-12-01T10:00:00","notes":"Premier rendez-vous"}`
7. PATCH /api/dossiers/1/statut `{"statut":"EN_COURS"}`
8. Login en CLIENT -> GET /api/dossiers (voit le sien), POST /api/dossiers -> 403
9. Login en ADMIN -> GET /api/audit
