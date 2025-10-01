import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { request: customerRequest } = await request.json()

    if (!customerRequest) {
      return NextResponse.json({ error: "La demande du client est requise" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      console.error("[v0] GROQ_API_KEY is not configured")
      return NextResponse.json(
        {
          level: 3,
          reason: "Service IA non configuré",
          category: "Escalade technique",
        },
        { status: 200 },
      )
    }

    // Analyze the request with Groq AI
    const systemPrompt = `Tu es un système de triage intelligent pour un service client de télécommunications (Free).
Analyse la demande du client et détermine le niveau de routage approprié :

Niveau 1 - IA Autonome (70-80% des requêtes) :
- Requêtes informationnelles simples (horaires, tarifs, FAQ)
- Suivi de commande et statuts
- Questions sur la documentation
- Modifications de compte simples (changement d'adresse, email)

Niveau 2 - IA Assistée (15-20% des requêtes) :
- Demandes nécessitant validation humaine
- Problèmes techniques moyennement complexes
- Demandes de remboursement ou gestes commerciaux
- Modifications de forfait ou d'offre

Niveau 3 - Humain Prioritaire (5-10% des requêtes) :
- Cas émotionnels ou clients mécontents
- Négociations commerciales complexes
- Problèmes techniques très complexes
- Clients VIP ou à risque de résiliation
- Réclamations graves

Réponds UNIQUEMENT avec un JSON au format suivant :
{
  "level": 1 | 2 | 3,
  "reason": "Explication courte de la décision",
  "category": "Catégorie de la demande"
}

Ne réponds qu'avec le JSON, rien d'autre.`

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: customerRequest },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      console.error("[v0] Groq API error:", response.status, response.statusText)
      return NextResponse.json(
        {
          level: 3,
          reason: "Erreur d'analyse, transfert vers un agent",
          category: "Escalade technique",
        },
        { status: 200 },
      )
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json(
        {
          level: 3,
          reason: "Erreur d'analyse, transfert vers un agent",
          category: "Escalade technique",
        },
        { status: 200 },
      )
    }

    // Parse the JSON response
    try {
      const result = JSON.parse(aiResponse)
      return NextResponse.json(result)
    } catch (parseError) {
      console.error("[v0] Failed to parse AI response:", aiResponse)
      return NextResponse.json(
        {
          level: 2,
          reason: "Analyse incomplète, assistance humaine recommandée",
          category: "Demande générale",
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("[v0] Error in route-call API:", error)
    return NextResponse.json(
      {
        level: 3,
        reason: "Erreur système, transfert immédiat vers un agent",
        category: "Escalade technique",
      },
      { status: 200 },
    )
  }
}
