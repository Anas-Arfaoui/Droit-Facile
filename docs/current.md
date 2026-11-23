# État actuel

## Sprint en cours : Sprint 3

> Mise a jour : le developpement local du Sprint 2 est termine. L'analyse des clauses est connectee au frontend, l'OCR local optionnel est configure et la configuration Docker est prete. Gemini et WhatsApp restent hors scope pour le moment.

### Sprint 3 - prochaine tranche de developpement

- modeliser les echeances et leurs statuts dans le backend ;
- creer les endpoints et l'interface de gestion des echeances ;
- ajouter les rappels internes ;
- rendre le resume valide exportable en PDF cote frontend ;
- preparer les reponses sourcees sans activer de nouveau fournisseur IA.

Le Sprint 1 est terminé : authentification JWT, rôles, dossiers clients, séances et audit sont disponibles.

Le Sprint 2 est maintenant réalisé à environ **75 %**.

### Fonctionnalités disponibles

- import de contrats PDF et DOCX ;
- extraction du texte des contrats ;
- détection de la langue française, arabe ou mixte ;
- stockage et téléchargement des contrats ;
- backend d'analyse des clauses avec Gemini ;
- upload, liste, téléchargement et suppression des documents du dossier ;
- partage des documents avec le client via un lien sécurisé ;
- affichage et téléchargement des documents depuis la page publique de suivi ;
- suivi du statut du dossier par lien public.

### Travail restant

- connecter l'analyse des clauses au frontend ;
- configurer et valider Gemini avec GEMINI_API_KEY ;
- ajouter l'OCR pour les contrats scannés ;
- intégrer WhatsApp pour envoyer le lien de suivi et les notifications ;
- ajouter les tests d'intégration et les tests de bout en bout ;
- vérifier le fonctionnement complet avec PostgreSQL, stockage de fichiers et Docker.

L'utilisation d'un modèle local Ollama est reportée. L'IA reste donc désactivable tant qu'une clé Gemini n'est pas configurée.

Le Sprint 3 n'est pas commencé : rappels d'échéances, résumé IA exportable et réponses IA sourcées restent à développer.

