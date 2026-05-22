import React, { useState, useEffect } from "react";
import { db, storage } from "./firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

function App() {
  const [notatki, setNotatki] = useState([]);
  const [isUploaded, setIsUploaded] = useState(false);
  const [wybranyPlik, setWybranyPlik] = useState(null);
  const [komunikatStatusu, setKomunikatStatusu] = useState("");

  useEffect(() => {
    const zapytanie = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    
    const odsubskrybuj = onSnapshot(zapytanie, (migawkaDanych) => {
      const tablicaUkonczonychNotatek = [];
      migawkaDanych.forEach((dokument) => {
        const dane = dokument.data();
        if (dane.status === "Completed") {
          tablicaUkonczonychNotatek.push({ id: dokument.id, ...dane });
        }
      });
      setNotatki(tablicaUkonczonychNotatek);
    });

    return () => odsubskrybuj();
  }, []);

  const obsługaZmianyPliku = (zdarzenie) => {
    const plik = zdarzenie.target.files[0];
    if (!plik) return;

    const poprawneRozszerzenie = plik.name.toLowerCase().endsWith(".wav");
    const poprawnyMimeType = plik.type === "audio/wav" || plik.type === "audio/x-wav";

    if (!poprawneRozszerzenie && !poprawnyMimeType) {
      setKomunikatStatusu("Tylko pliki .wav");
      setWybranyPlik(null);
      zdarzenie.target.value = ""; 
      return;
    }

    setWybranyPlik(plik);
    setKomunikatStatusu("Sprawdzanie formatu.");
  };

  const wyslijAudio = async () => {
    if (!wybranyPlik) {
      setKomunikatStatusu("Najpierw wybierz plik");
      return;
    }
    
    setIsUploaded(true);
    setKomunikatStatusu("Wysyłanie do backendu...");
    
    const oczyszczonaNazwaPliku = wybranyPlik.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const unikalnaNazwaPliku = `${Date.now()}_${oczyszczonaNazwaPliku}`;
    const sciezkaStorage = ref(storage, `audio/${unikalnaNazwaPliku}`);

    try {
      await uploadBytes(sciezkaStorage, wybranyPlik);
      setKomunikatStatusu("Wysłano plik.");
      setWybranyPlik(null);
      document.getElementById("file-input").value = ""; 
    } catch (blad) {
      console.error(blad);
      setKomunikatStatusu("Wysyłanie nie powiodło się.");
    } finally {
      setIsUploaded(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans antialiased">
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        <header className="mb-12">
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 uppercase">
            VoiceToNote WSB Project
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          <div className="flex flex-col space-y-6">
            <section className="bg-white rounded-xl p-8 border border-neutral-300 shadow-sm">
              <h2 className="text-xs font-black tracking-wider text-neutral-500 uppercase mb-4">
                Miejsce na notkę
              </h2>
              
              <div className="flex flex-col items-center justify-center border border-neutral-300 border-dashed rounded-lg p-10 bg-neutral-50 hover:bg-neutral-100/50 transition-colors relative">
                <input
                  type="file"
                  id="file-input"
                  accept=".wav, audio/wav, audio/x-wav"
                  onChange={obsługaZmianyPliku}
                  disabled={isUploaded}
                  className="hidden"
                />
                
                <label
                  htmlFor="file-input"
                  className={`cursor-pointer flex flex-col items-center space-y-3 ${isUploaded ? "pointer-events-none opacity-40" : ""}`}
                >
                  <div className="text-neutral-900">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-neutral-800">
                    Kliknij lub wrzuć plik
                  </span>
                </label>

                {wybranyPlik && (
                  <div className="absolute bottom-4 right-4 bg-white border border-neutral-300 px-3 py-1.5 rounded flex items-center space-x-2 shadow-sm max-w-[180px]">
                    <span className="text-xs font-mono text-neutral-600 truncate">
                      {wybranyPlik.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={wyslijAudio}
                  disabled={!wybranyPlik || isUploaded}
                  className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs tracking-widest uppercase rounded transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  {isUploaded ? "Przetwarzam..." : "Kliknij by przetworzyć"}
                </button>
              </div>

              {komunikatStatusu && (
                <p className="mt-4 text-xs font-medium text-neutral-500 italic">
                  {komunikatStatusu}
                </p>
              )}
            </section>

            <div className="bg-neutral-200 rounded-xl p-5 border border-neutral-300 shadow-inner flex flex-col items-center">
              <p className="text-xs font-black tracking-widest text-neutral-600 uppercase mb-3">
                Wykonano na zajęcia chmurowe WSB
              </p>
              
              <ul className="w-full max-w-xs text-left space-y-1 bg-white/40 rounded-lg p-3 border border-neutral-300/60 text-[11px] font-mono text-neutral-600">
                <li className="flex items-center space-x-2">
                  <span className="text-neutral-400 font-bold">1.</span>
                  <span>Jakub Smołka</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-neutral-400 font-bold">2.</span>
                  <span>Radosław Rosikoń</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-neutral-400 font-bold">3.</span>
                  <span>Maciek Zakrzewski</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-neutral-400 font-bold">4.</span>
                  <span>Kamila Maciejczyk</span>
                </li>
              </ul>
            </div>
          </div>

          <section className="bg-neutral-900 text-white rounded-xl p-8 shadow-xl min-h-[580px]">
            <h2 className="text-xs font-black tracking-wider text-neutral-400 uppercase mb-6">
              Notatki: ({notatki.length})
            </h2>

            {notatki.length === 0 ? (
              <div className="text-center py-28 text-neutral-500 text-xs font-bold uppercase border border-neutral-800 border-dashed rounded-lg">
                Brak Notatek
              </div>
            ) : (
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
                {notatki.map((notatka) => (
                  <div
                    key={notatka.id}
                    className="bg-white text-neutral-900 rounded-lg p-5 border border-neutral-200 transition-all hover:shadow-md"
                  >
                    <div className="pb-2 mb-2 border-b border-neutral-100">
                      <h3 className="font-black text-base tracking-tight truncate text-neutral-900">
                        {notatka.title}
                      </h3>
                      <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                        Stworzono: {notatka.createdAt?.toDate ? notatka.createdAt.toDate().toLocaleTimeString() : "Just now"}
                      </p>
                    </div>

                    <p className="text-xs font-medium text-neutral-700 leading-relaxed">
                      {notatka.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

export default App;