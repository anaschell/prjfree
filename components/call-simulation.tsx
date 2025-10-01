"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, PhoneOff, Mic, MicOff, Volume2, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

type CallStatus = "idle" | "calling" | "connected" | "analyzing" | "routed"
type RoutingLevel = 1 | 2 | 3 | null

interface RoutingResult {
  level: RoutingLevel
  reason: string
  category: string
}

export function CallSimulation() {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle")
  const [customerRequest, setCustomerRequest] = useState("")
  const [routingResult, setRoutingResult] = useState<RoutingResult | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [transcript, setTranscript] = useState<string[]>([])

  const startCall = () => {
    setCallStatus("calling")
    setTranscript([])
    setRoutingResult(null)

    setTimeout(() => {
      setCallStatus("connected")
      addToTranscript(
        "IA",
        "Bonjour, bienvenue au service client Free. Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?",
      )
    }, 2000)
  }

  const endCall = () => {
    setCallStatus("idle")
    setCustomerRequest("")
    setTranscript([])
    setRoutingResult(null)
  }

  const addToTranscript = (speaker: string, message: string) => {
    setTranscript((prev) => [...prev, `${speaker}: ${message}`])
  }

  const analyzeRequest = async () => {
    if (!customerRequest.trim()) return

    setCallStatus("analyzing")
    addToTranscript("Client", customerRequest)

    try {
      const response = await fetch("/api/route-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: customerRequest }),
      })

      const data = await response.json()

      if (data.error) {
        addToTranscript("IA", "Désolé, je rencontre un problème technique. Je vous transfère vers un agent.")
        setRoutingResult({ level: 3, reason: "Erreur technique", category: "Escalade" })
      } else {
        setRoutingResult(data)

        let message = ""
        if (data.level === 1) {
          message = `${data.reason} Je peux vous aider directement avec cela.`
        } else if (data.level === 2) {
          message = `${data.reason} Je vais préparer votre dossier et vous mettre en relation avec un agent qui validera la solution.`
        } else {
          message = `${data.reason} Je vous transfère immédiatement vers un agent spécialisé.`
        }

        addToTranscript("IA", message)
      }

      setCallStatus("routed")
    } catch (error) {
      console.error("Error analyzing request:", error)
      addToTranscript("IA", "Désolé, je rencontre un problème. Je vous transfère vers un agent.")
      setRoutingResult({ level: 3, reason: "Erreur système", category: "Escalade" })
      setCallStatus("routed")
    }
  }

  const getLevelInfo = (level: RoutingLevel) => {
    switch (level) {
      case 1:
        return {
          title: "Niveau 1 - IA Autonome",
          subtitle: "70-80% des requêtes",
          color: "bg-emerald-500",
          items: [
            "Requêtes informationnelles simples",
            "Suivi de commande et statuts",
            "FAQ et documentation",
            "Modifications de compte",
          ],
        }
      case 2:
        return {
          title: "Niveau 2 - IA Assistée",
          subtitle: "15-20% des requêtes",
          color: "bg-blue-500",
          items: [
            "IA prépare le contexte + Agent valide",
            "Suggestions de réponses à l'agent",
            "Co-pilotage temps réel",
            "Escalade intelligente si nécessaire",
          ],
        }
      case 3:
        return {
          title: "Niveau 3 - Humain Prioritaire",
          subtitle: "5-10% des requêtes",
          color: "bg-purple-500",
          items: [
            "Cas émotionnels/sensibles",
            "Négociations commerciales",
            "Problèmes techniques complexes",
            "Clients VIP ou à risque de churn",
          ],
        }
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">APPEL CLIENT</h2>
        <p className="text-xl text-muted-foreground">Simulation de triage intelligent par IA</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Phone Interface */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Interface d'appel
            </CardTitle>
            <CardDescription>Simulez un appel au service client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Call Status */}
            <div className="flex items-center justify-center gap-4 p-6 bg-muted rounded-lg">
              {callStatus === "idle" && (
                <div className="text-center">
                  <Phone className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Prêt à appeler</p>
                </div>
              )}
              {callStatus === "calling" && (
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-2 animate-spin text-blue-500" />
                  <p className="text-sm">Connexion en cours...</p>
                </div>
              )}
              {(callStatus === "connected" || callStatus === "analyzing" || callStatus === "routed") && (
                <div className="text-center w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Volume2 className="h-6 w-6 text-green-500 animate-pulse" />
                    <p className="text-sm font-medium">Appel en cours</p>
                  </div>
                  {callStatus === "analyzing" && (
                    <p className="text-xs text-muted-foreground">Analyse de la demande...</p>
                  )}
                </div>
              )}
            </div>

            {/* Transcript */}
            {transcript.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto p-4 bg-muted/50 rounded-lg">
                {transcript.map((line, index) => {
                  const [speaker, ...messageParts] = line.split(": ")
                  const message = messageParts.join(": ")
                  return (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        speaker === "IA"
                          ? "bg-blue-100 dark:bg-blue-900/30 ml-4"
                          : "bg-green-100 dark:bg-green-900/30 mr-4"
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1">{speaker}</p>
                      <p className="text-sm">{message}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Customer Input */}
            {callStatus === "connected" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Votre demande :</label>
                <Textarea
                  placeholder="Décrivez votre problème ou question..."
                  value={customerRequest}
                  onChange={(e) => setCustomerRequest(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <Button onClick={analyzeRequest} disabled={!customerRequest.trim()} className="w-full">
                  Envoyer la demande
                </Button>
              </div>
            )}

            {/* Call Controls */}
            <div className="flex gap-2">
              {callStatus === "idle" ? (
                <Button onClick={startCall} className="flex-1" size="lg">
                  <Phone className="mr-2 h-5 w-5" />
                  Démarrer l'appel
                </Button>
              ) : (
                <>
                  <Button onClick={() => setIsMuted(!isMuted)} variant="outline" size="lg" className="flex-1">
                    {isMuted ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
                    {isMuted ? "Réactiver" : "Muet"}
                  </Button>
                  <Button onClick={endCall} variant="destructive" size="lg" className="flex-1">
                    <PhoneOff className="mr-2 h-5 w-5" />
                    Raccrocher
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Routing Result */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Résultat du triage</CardTitle>
            <CardDescription>Niveau de routage déterminé par l'IA</CardDescription>
          </CardHeader>
          <CardContent>
            {!routingResult ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>En attente d'analyse...</p>
                <p className="text-sm mt-2">Démarrez un appel et décrivez votre demande</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${getLevelInfo(routingResult.level)?.color} text-white`}>
                  <h3 className="font-bold text-lg mb-1">{getLevelInfo(routingResult.level)?.title}</h3>
                  <p className="text-sm opacity-90">{getLevelInfo(routingResult.level)?.subtitle}</p>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Catégorie :</p>
                    <p className="text-sm">{routingResult.category}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Raison :</p>
                    <p className="text-sm">{routingResult.reason}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Levels Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((level) => {
          const info = getLevelInfo(level as RoutingLevel)
          if (!info) return null

          return (
            <Card
              key={level}
              className={`border-2 ${routingResult?.level === level ? "ring-2 ring-offset-2 ring-primary" : ""}`}
            >
              <CardHeader>
                <div
                  className={`w-12 h-12 rounded-full ${info.color} flex items-center justify-center text-white font-bold text-xl mb-2`}
                >
                  {level}
                </div>
                <CardTitle className="text-lg">{info.title}</CardTitle>
                <CardDescription>{info.subtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {info.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">✦</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
