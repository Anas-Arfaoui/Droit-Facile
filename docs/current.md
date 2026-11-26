# État actuel

## Sprint en cours : Sprint 3

> Mise a jour : le developpement local du Sprint 2 est termine. L'analyse des clauses est connectee au frontend, l'OCR local optionnel est configure et la configuration Docker est prete. Gemini et WhatsApp restent hors scope pour le moment.

### Etat de livraison au 26 novembre 2026

#### Sprint 3 termine pour la partie developpement local

- echeances persistantes liees aux dossiers ;
- creation, lecture, modification, changement de statut et suppression des echeances ;
- acces en lecture pour le client et gestion reservee a l'avocat ;
- panneau frontend des echeances dans la page dossier ;
- modification des titres, descriptions, dates, rappels et statuts ;
- endpoint backend des rappels a venir et echeances en retard ;
- execution et compilation validees avec Docker Compose, PostgreSQL et Spring Boot ;
- tests frontend et build de production valides.

#### Travail restant

- afficher les rappels sur le tableau de bord frontend ;
- ajouter une tache planifiee pour traiter automatiquement les rappels ;
- choisir un canal de notification interne ou e-mail ;
- remplacer l'impression navigateur par un vrai export PDF telechargeable ;
- ajouter les tests backend d'integration et les tests end-to-end ;
- configurer Gemini pour les resumes et reponses IA sour dees ;
- integrer WhatsApp pour les notifications et les liens de suivi.

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

### Historique du Sprint 2 avant les derniers travaux

- connecter l'analyse des clauses au frontend ;
- configurer et valider Gemini avec GEMINI_API_KEY ;
- ajouter l'OCR pour les contrats scannés ;
- intégrer WhatsApp pour envoyer le lien de suivi et les notifications ;
- ajouter les tests d'intégration et les tests de bout en bout ;
- vérifier le fonctionnement complet avec PostgreSQL, stockage de fichiers et Docker.

L'utilisation d'un modèle local Ollama est reportée. L'IA reste donc désactivable tant qu'une clé Gemini n'est pas configurée.

Le Sprint 3 n'est pas commencé : rappels d'échéances, résumé IA exportable et réponses IA sourcées restent à développer.

