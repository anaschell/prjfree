export const maxDuration = 30

export async function POST(req: Request) {
  const { message } = await req.json()

  if (!process.env.GROQ_API_KEY) {
    console.error("[v0] GROQ_API_KEY is not configured")
    return Response.json(
      {
        level: 3,
        response:
          "⚠️ Configuration manquante : La clé API Groq n'est pas configurée sur ce serveur.\n\n" +
          "📋 Pour activer le chatbot IA :\n" +
          "1. Créez un compte gratuit sur console.groq.com\n" +
          "2. Générez une clé API\n" +
          "3. Ajoutez-la dans les variables d'environnement Vercel (GROQ_API_KEY)\n" +
          "4. Redéployez l'application\n\n" +
          "📖 Consultez DEPLOYMENT.md pour les instructions détaillées.",
        error: "GROQ_API_KEY not configured",
        category: "Erreur système",
      },
      { status: 500 },
    )
  }

  console.log("[v0] Received message:", message)

  try {
    console.log("[v0] Step 1: Analyzing request to determine triage level...")

    const triageResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Tu es un système de triage intelligent pour un service client de télécommunications (Free).
Analyse la demande du client et détermine le niveau de routage approprié :

Niveau 1 - IA Autonome (70-80% des requêtes) :
- Requêtes informationnelles simples (horaires, tarifs, FAQ)
- Suivi de commande et statuts
- Questions sur la documentation
- Modifications de compte simples (changement d'adresse, email)
- Questions générales sur les offres et services

Niveau 2 - IA Assistée (15-20% des requêtes) :
- Demandes nécessitant validation humaine
- Problèmes techniques moyennement complexes
- Demandes de remboursement ou gestes commerciaux
- Modifications de forfait ou d'offre
- Questions sur la facturation avec anomalies

Niveau 3 - Humain Prioritaire (5-10% des requêtes) :
- Cas émotionnels ou clients mécontents/en colère
- Négociations commerciales complexes
- Problèmes techniques très complexes ou récurrents
- Clients VIP ou à risque de résiliation
- Réclamations graves ou menaces légales

Réponds UNIQUEMENT avec un JSON au format suivant :
{
  "level": 1 | 2 | 3,
  "reason": "Explication courte de la décision",
  "category": "Catégorie de la demande"
}

Ne réponds qu'avec le JSON, rien d'autre.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    })

    if (!triageResponse.ok) {
      console.error("[v0] Triage API error:", triageResponse.status)
      throw new Error("Triage failed")
    }

    const triageData = await triageResponse.json()
    const triageResult = JSON.parse(triageData.choices[0]?.message?.content || '{"level": 3}')

    console.log("[v0] Triage result:", triageResult)

    if (triageResult.level === 3) {
      // Niveau 3: Immediate transfer to human with enriched context
      console.log("[v0] Level 3: Transferring to human agent")
      return Response.json({
        level: 3,
        response: "TRANSFER_TO_HUMAN",
        category: triageResult.category,
        reason: triageResult.reason,
      })
    }

    console.log("[v0] Generating AI response...")

    const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Tu es un assistant virtuel pour Free, l'opérateur télécom français. 
      
Ton rôle est d'aider les clients avec leurs questions sur les services Free (internet, mobile, box, etc.).

Voici les informations que tu peux utiliser pour répondre (basées sur https://assistance.free.fr):

ABONNEMENT ET COMPTE:
- Factures: Consultables dans l'Espace Abonné sur free.fr, section "Mes factures"
- Mot de passe oublié: Cliquer sur "Mot de passe oublié" sur la page de connexion
- Modifier informations: Espace Abonné > "Mes informations"
- Résiliation: Lettre recommandée avec AR à Free, Service Résiliation, 75371 Paris Cedex 08

INTERNET ET BOX:
- Problème de connexion: Vérifier branchements, redémarrer la box (débrancher 30 secondes)
- WiFi lent: Se rapprocher de la box, utiliser la bande 5GHz, redémarrer
- Mot de passe WiFi: Interface Freebox (mafreebox.freebox.fr) > WiFi > Sécurité
- Test de débit: Disponible sur free.fr/assistance

MOBILE:
- Activer SIM: Appeler le 555 depuis le mobile Free ou via l'Espace Abonné
- Code PUK: Disponible dans l'Espace Abonné > "Ma ligne mobile"
- Téléphone volé: Suspendre la ligne via l'Espace Abonné ou appeler le 3244

OFFRES:
- Freebox Révolution Light: 19,99€/mois
- Freebox Pop: 29,99€/mois  
- Freebox Ultra: 39,99€/mois
- Forfaits mobile: de 2€ à 19,99€/mois

Réponds de manière claire, concise et professionnelle en français.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!aiResponse.ok) {
      console.error("[v0] AI response error:", aiResponse.status)
      throw new Error("AI response failed")
    }

    const aiData = await aiResponse.json()
    const responseText = aiData.choices[0]?.message?.content || "Je n'ai pas pu générer une réponse."

    console.log("[v0] AI response generated successfully")

    return Response.json({
      level: triageResult.level,
      response: responseText,
      category: triageResult.category,
      reason: triageResult.reason,
    })
  } catch (error) {
    console.error("[v0] Error generating AI response:", error)
    return Response.json(
      {
        level: 3,
        response: "TRANSFER_TO_HUMAN",
        category: "Erreur système",
        reason: "Erreur technique",
      },
      { status: 500 },
    )
  }
}
