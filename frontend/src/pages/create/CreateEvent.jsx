import { Construction } from 'lucide-react';

export default function CreateEvent() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold">Creer un evenement</h1>
      <p className="mb-6 text-sm text-celebra-dark/60">
        L'assistant de creation en etapes arrive a l'etape suivante du developpement.
      </p>
      <div className="card flex flex-col items-center gap-3 p-10 text-center text-celebra-dark/70">
        <Construction size={28} className="text-celebra-gold" />
        <p>Module en cours de construction.</p>
      </div>
    </div>
  );
}
