import { CallSimulation } from "@/components/call-simulation"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Service Client
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Notre système intelligent de routage d'appels vous met en contact avec le bon interlocuteur
            </p>
          </div>

          <CallSimulation />
        </div>
      </div>
    </div>
  )
}
