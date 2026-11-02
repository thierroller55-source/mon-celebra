# Célébra : modèle économique Premium

*Avis et recommandations · 29 octobre 2026*

**Verdict :** la structure prévue (gratuit, Premium, revenus complémentaires) est saine et adaptée à un démarrage. Je recommande toutefois de changer trois choses avant le lancement, et de ne pas brancher les paiements tout de suite.

## Ce qui est bon

- **1 événement gratuit** : c'est le bon levier de découverte, et la page publique aux couleurs de Célébra fait de la publicité à chaque invité.
- **La suppression de la marque en Premium** : un classique qui fonctionne, car les gens paient pour une affiche « à leur nom ».
- **La liste des fonctions payantes** est cohérente : plus de personnalisation, plus de gestion, plus d'image.

## Ce que je changerais

### 1. L'abonnement ne convient pas à la plupart des clients

Un mariage ou un baptême n'arrive qu'une fois. Il vaut mieux faire payer **par événement** (un « Pass Événement » unique, valable 12 mois), et réserver l'abonnement aux **clients réguliers** : organisateurs de mariage, photographes, traiteurs, salles de fête, agences. Ce sont eux qui créent plusieurs événements par mois.

Avec le mobile money, le prélèvement automatique mensuel est en général difficile. Mieux vaut vendre des périodes prépayées (1 mois, 12 mois), à renouveler à la main.

### 2. Ne pas bloquer toute l'utilité en gratuit

Un couple qui ne peut ni suivre ses invités ni recevoir de messages se demandera à quoi sert la version gratuite. Il est préférable de garder un RSVP simple en gratuit (par exemple jusqu'à 30 invités) et de faire payer la gestion avancée : invités illimités, export, rappels, statistiques. Le gratuit doit montrer la valeur, le Premium doit la prolonger.

### 3. Aligner la communication

Les 5 images de campagne affichent « 100 % gratuit » et mentionnent le RSVP et le livre d'or. Si ces fonctions deviennent payantes, ce message devient trompeur. À faire :

- remplacer par « Gratuit pour commencer » avant la prochaine publication ;
- prévenir les utilisateurs actuels de ce qui change ;
- laisser leurs événements existants tels quels.

## Les autres sources de revenus

| Idée | Avis |
| --- | --- |
| Statistiques avancées | Peu coûteuses à produire, bonne option Premium |
| Domaine personnalisé | Complexe à gérer, à réserver aux offres professionnelles, plus tard |
| E-mails aux invités | Faisables dès que l'envoi d'emails est fiable |
| **SMS d'invitation** | À vendre **à la consommation** (paquets prépayés), jamais en forfait illimité : chaque SMS a un coût |
| WhatsApp | Le partage par lien est gratuit et déjà utilisé par les clients : le garder gratuit |

## Les paiements au Sénégal

Selon un guide récent, la majorité des clients paient avec Wave ou Orange Money, une minorité avec Free Money, et seule une fraction possède une carte bancaire utilisable en ligne. Des agrégateurs comme PayDunya, CinetPay, PayTech ou Hub2 regroupent Wave, Orange Money, Free Money et la carte dans une seule intégration.

Les commissions se comptent en pourcentage du montant (de l'ordre de 1 % pour Wave, davantage chez les agrégateurs). Il faut vérifier les tarifs actuels et le délai de validation du compte marchand avant de s'engager.

## Calendrier conseillé

1. **Stabiliser d'abord le produit.** Il reste des bugs sur le QR code, la connexion, les emails et le responsive. Personne ne paie pour un site dont le QR code d'une affiche ne s'ouvre pas.
2. **Tester la volonté de payer sans coder de paiement.** Pour les 20 à 50 premiers clients, envoyer un lien de paiement Wave ou Orange Money par WhatsApp, et activer le Premium à la main depuis un champ « plan » dans l'administration. On saura ainsi quel prix et quelles fonctions les gens achètent vraiment.
3. **Intégrer ensuite un agrégateur**, une fois le modèle validé.

## Les coûts qui arrivent avec les revenus

Dès que l'on encaisse, on sort de la zone « gratuit » :

- le plan gratuit de Vercel est réservé à un usage non commercial, il faudra passer à un plan payant ;
- un nom de domaine ;
- un envoi d'emails fiable ;
- probablement plus de stockage d'images.

Quelques ventes par mois couvrent généralement ces frais, mais ils sont à calculer avant de fixer les prix.

## Autres points à prévoir

- **Conditions de vente et politique de remboursement**, factures, et déclaration d'activité selon le statut.
- **Protection des données** (photos d'enfants, listes d'invités) : c'est aussi un argument de confiance à mettre en avant.
- **Abus du gratuit** : limiter les comptes multiples (vérification du téléphone par code SMS).
- **Durée de vie des événements gratuits** (par exemple 3 mois), pour maîtriser le stockage.
- **Un seul nom de marque** : le document de départ dit « Mon Celebra », le site « Célébra ». À trancher avant de commencer à facturer.

## Une première grille à tester

|  | Gratuit | Pass Événement | Pro (organisateurs) |
| --- | --- | --- | --- |
| Événements | 1 | 1 (par pass) | Plusieurs |
| Modèles | Base | Premium | Premium + sur mesure |
| RSVP | Simple | Avancé | Avancé |
| Galerie, livre d'or | Limités | Complets | Complets |
| Marque Célébra | Visible | Retirée | Retirée, logo du client |
| Durée en ligne | 3 mois | 12 mois | Tant que l'abonnement est actif |

Il n'existe pas ici de données fiables sur les prix que les clients accepteront : ils sont à fixer avec les premières ventes, en comparant avec ce que coûte un graphiste pour une affiche.

## Prochaines étapes possibles

- Rédiger le prompt de développement : champ `plan` sur les comptes, limites par plan, activation manuelle par l'administrateur.
- Préparer une page « Tarifs » avec ces trois offres.

## Sources

- Guide « Accepter les paiements en ligne au Sénégal en 2026 » : https://kolonell.com/fr/blog/guide-complet-accepter-paiements-en-ligne-senegal-2026
- Top Payment Gateways in Senegal : https://www.dusupay.com/post/top-payment-gateways-in-senegal
