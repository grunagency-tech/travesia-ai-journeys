export type Language = 'ES' | 'EN' | 'DE' | 'PT' | 'IT';

export const languages = {
  ES: { code: 'ES', flag: '🇪🇸', name: 'Español' },
  EN: { code: 'EN', flag: '🇬🇧', name: 'English' },
  DE: { code: 'DE', flag: '🇩🇪', name: 'Deutsch' },
  PT: { code: 'PT', flag: '🇵🇹', name: 'Português' },
  IT: { code: 'IT', flag: '🇮🇹', name: 'Italiano' },
};

export const translations = {
  hero: {
    title: {
      ES: 'Planea tu viaje completo en segundos',
      EN: 'Plan your complete trip in seconds',
      DE: 'Planen Sie Ihre komplette Reise in Sekunden',
      PT: 'Planeje sua viagem completa em segundos',
      IT: 'Pianifica il tuo viaggio completo in secondi',
    },
    subtitle: {
      ES: 'Hoteles, vuelos, actividades, itinerarios personalizados, en un solo lugar',
      EN: 'Hotels, flights, activities, personalized itineraries, all in one place',
      DE: 'Hotels, Flüge, Aktivitäten, personalisierte Reisepläne, alles an einem Ort',
      PT: 'Hotéis, voos, atividades, itinerários personalizados, tudo em um só lugar',
      IT: 'Hotel, voli, attività, itinerari personalizzati, tutto in un unico posto',
    },
    placeholder: {
      ES: 'Se preciso. Ej. "Quiero viajar a Buenos Aires con mi pareja por 7 días con un presupuesto de $900, hospedarnos cerca al Obelisco y realizar actividades extremas fuera de la ciudad"',
      EN: 'Be specific. E.g. "I want to travel to Buenos Aires with my partner for 7 days with a budget of $900, stay near the Obelisk and do extreme activities outside the city"',
      DE: 'Seien Sie präzise. Z.B. "Ich möchte mit meinem Partner für 7 Tage nach Buenos Aires reisen mit einem Budget von $900, in der Nähe des Obelisken übernachten und extreme Aktivitäten außerhalb der Stadt unternehmen"',
      PT: 'Seja específico. Ex. "Quero viajar para Buenos Aires com meu parceiro por 7 dias com orçamento de $900, ficar perto do Obelisco e fazer atividades radicais fora da cidade"',
      IT: 'Sii specifico. Es. "Voglio viaggiare a Buenos Aires con il mio partner per 7 giorni con un budget di $900, soggiornare vicino all\'Obelisco e fare attività estreme fuori città"',
    },
    attachFiles: {
      ES: 'Adjuntar archivos',
      EN: 'Attach files',
      DE: 'Dateien anhängen',
      PT: 'Anexar arquivos',
      IT: 'Allega file',
    },
    generateButton: {
      ES: 'Generar mi itinerario',
      EN: 'Generate my itinerary',
      DE: 'Meine Reiseroute erstellen',
      PT: 'Gerar meu itinerário',
      IT: 'Genera il mio itinerario',
    },
    betaText: {
      ES: 'Gratis durante la beta. Sin tarjeta. Sin problemas. ↓',
      EN: 'Free during beta. No card. No worries. ↓',
      DE: 'Kostenlos während der Beta. Keine Karte. Keine Sorgen. ↓',
      PT: 'Grátis durante o beta. Sem cartão. Sem preocupações. ↓',
      IT: 'Gratis durante la beta. Nessuna carta. Nessun problema. ↓',
    },
  },
  howItWorks: {
    title: {
      ES: '¿Cómo funciona',
      EN: 'How does',
      DE: 'Wie funktioniert',
      PT: 'Como funciona',
      IT: 'Come funziona',
    },
    description: {
      ES: 'Tu planificador de viajes con inteligencia artificial crea itinerarios personalizados con vuelos, hoteles, actividades y mucho más, en segundos.',
      EN: 'Your AI travel planner creates personalized itineraries with flights, hotels, activities and much more, in seconds.',
      DE: 'Ihr KI-Reiseplaner erstellt personalisierte Reiserouten mit Flügen, Hotels, Aktivitäten und vielem mehr in Sekunden.',
      PT: 'Seu planejador de viagens com IA cria itinerários personalizados com voos, hotéis, atividades e muito mais, em segundos.',
      IT: 'Il tuo pianificatore di viaggi con IA crea itinerari personalizzati con voli, hotel, attività e molto altro, in pochi secondi.',
    },
    step1Title: {
      ES: 'Describe tu idea',
      EN: 'Describe your idea',
      DE: 'Beschreiben Sie Ihre Idee',
      PT: 'Descreva sua ideia',
      IT: 'Descrivi la tua idea',
    },
    step1Description: {
      ES: 'Cuéntanos cómo imaginas tu viaje y deja que TravesIA haga el resto.',
      EN: 'Tell us how you imagine your trip and let TravesIA do the rest.',
      DE: 'Erzählen Sie uns, wie Sie sich Ihre Reise vorstellen, und lassen Sie TravesIA den Rest erledigen.',
      PT: 'Conte-nos como você imagina sua viagem e deixe que TravesIA faça o resto.',
      IT: 'Raccontaci come immagini il tuo viaggio e lascia che TravesIA faccia il resto.',
    },
    step2Title: {
      ES: 'Recibe tu itinerario personalizado al instante',
      EN: 'Get your personalized itinerary instantly',
      DE: 'Erhalten Sie sofort Ihre personalisierte Reiseroute',
      PT: 'Receba seu itinerário personalizado instantaneamente',
      IT: 'Ricevi il tuo itinerario personalizzato all\'istante',
    },
    step2Description: {
      ES: 'Obtén un plan de viaje hecho a tu medida en segundos.',
      EN: 'Get a tailor-made travel plan in seconds.',
      DE: 'Erhalten Sie in Sekunden einen maßgeschneiderten Reiseplan.',
      PT: 'Obtenha um plano de viagem feito sob medida em segundos.',
      IT: 'Ottieni un piano di viaggio su misura in pochi secondi.',
    },
    step3Title: {
      ES: 'Ajusta, guarda y comparte',
      EN: 'Adjust, save and share',
      DE: 'Anpassen, speichern und teilen',
      PT: 'Ajuste, salve e compartilhe',
      IT: 'Regola, salva e condividi',
    },
    step3Description: {
      ES: 'Personaliza tu itinerario y compártelo fácilmente.',
      EN: 'Customize your itinerary and share it easily.',
      DE: 'Passen Sie Ihre Reiseroute an und teilen Sie sie einfach.',
      PT: 'Personalize seu itinerário e compartilhe-o facilmente.',
      IT: 'Personalizza il tuo itinerario e condividilo facilmente.',
    },
    step4Title: {
      ES: 'Reserva seguro con nuestros partners',
      EN: 'Book safely with our partners',
      DE: 'Buchen Sie sicher mit unseren Partnern',
      PT: 'Reserve com segurança com nossos parceiros',
      IT: 'Prenota in sicurezza con i nostri partner',
    },
    step4Description: {
      ES: 'Reserva todo tu viaje de forma rápida y confiable.',
      EN: 'Book your entire trip quickly and reliably.',
      DE: 'Buchen Sie Ihre gesamte Reise schnell und zuverlässig.',
      PT: 'Reserve toda a sua viagem de forma rápida e confiável.',
      IT: 'Prenota tutto il tuo viaggio in modo rapido e affidabile.',
    },
    tryButton: {
      ES: '¡Pruébalo YA!',
      EN: 'Try it NOW!',
      DE: 'Probieren Sie es JETZT!',
      PT: 'Experimente AGORA!',
      IT: 'Provalo ORA!',
    },
  },
  whyUse: {
    title: {
      ES: '¿Por qué usar',
      EN: 'Why use',
      DE: 'Warum',
      PT: 'Por que usar',
      IT: 'Perché usare',
    },
    description: {
      ES: 'Tu asistente de viajes con inteligencia artificial crea itinerarios con vuelos, hoteles, actividades y lo que necesites, en segundos',
      EN: 'Your AI travel assistant creates itineraries with flights, hotels, activities and whatever you need, in seconds',
      DE: 'Ihr KI-Reiseassistent erstellt Reiserouten mit Flügen, Hotels, Aktivitäten und allem, was Sie brauchen, in Sekunden',
      PT: 'Seu assistente de viagens com IA cria itinerários com voos, hotéis, atividades e o que você precisar, em segundos',
      IT: 'Il tuo assistente di viaggio con IA crea itinerari con voli, hotel, attività e tutto ciò di cui hai bisogno, in pochi secondi',
    },
    feature1Title: {
      ES: 'Todo tu viaje, desde una sola conversación',
      EN: 'Your entire trip, from one conversation',
      DE: 'Ihre gesamte Reise aus einem Gespräch',
      PT: 'Toda a sua viagem, de uma só conversa',
      IT: 'Tutto il tuo viaggio, da una sola conversazione',
    },
    feature1Description: {
      ES: 'Organiza vuelos, hoteles y experiencias fácilmente, sin complicaciones.',
      EN: 'Organize flights, hotels and experiences easily, without complications.',
      DE: 'Organisieren Sie Flüge, Hotels und Erlebnisse einfach und unkompliziert.',
      PT: 'Organize voos, hotéis e experiências facilmente, sem complicações.',
      IT: 'Organizza voli, hotel ed esperienze facilmente, senza complicazioni.',
    },
    feature2Title: {
      ES: 'Ahorra horas de búsqueda y comparación',
      EN: 'Save hours of searching and comparing',
      DE: 'Sparen Sie Stunden bei der Suche und beim Vergleich',
      PT: 'Economize horas de pesquisa e comparação',
      IT: 'Risparmia ore di ricerca e confronto',
    },
    feature2Description: {
      ES: 'Nosotros encontramos las mejores opciones por ti, rápido y claro.',
      EN: 'We find the best options for you, fast and clear.',
      DE: 'Wir finden die besten Optionen für Sie, schnell und klar.',
      PT: 'Encontramos as melhores opções para você, rápido e claro.',
      IT: 'Troviamo le migliori opzioni per te, veloce e chiaro.',
    },
    feature3Title: {
      ES: 'Precios y disponibilidad en tiempo real',
      EN: 'Real-time prices and availability',
      DE: 'Echtzeit-Preise und Verfügbarkeit',
      PT: 'Preços e disponibilidade em tempo real',
      IT: 'Prezzi e disponibilità in tempo reale',
    },
    feature3Description: {
      ES: 'Tarifas actualizadas al instante, sin sorpresas ni letras pequeñas.',
      EN: 'Instantly updated rates, no surprises or fine print.',
      DE: 'Sofort aktualisierte Tarife, keine Überraschungen oder Kleingedrucktes.',
      PT: 'Tarifas atualizadas instantaneamente, sem surpresas ou letras miúdas.',
      IT: 'Tariffe aggiornate istantaneamente, senza sorprese o clausole scritte in piccolo.',
    },
    feature4Title: {
      ES: 'Planes hechos por viajeros para viajeros',
      EN: 'Plans made by travelers for travelers',
      DE: 'Pläne von Reisenden für Reisende',
      PT: 'Planos feitos por viajantes para viajantes',
      IT: 'Piani fatti da viaggiatori per viaggiatori',
    },
    feature4Description: {
      ES: 'Itinerarios que se ajustan a tu estilo, cultura y presupuesto',
      EN: 'Itineraries that fit your style, culture and budget',
      DE: 'Reiserouten, die zu Ihrem Stil, Ihrer Kultur und Ihrem Budget passen',
      PT: 'Itinerários que se ajustam ao seu estilo, cultura e orçamento',
      IT: 'Itinerari che si adattano al tuo stile, cultura e budget',
    },
  },
  navbar: {
    howItWorks: {
      ES: '¿Cómo funciona?',
      EN: 'How it works?',
      DE: 'Wie funktioniert es?',
      PT: 'Como funciona?',
      IT: 'Come funziona?',
    },
    login: {
      ES: 'Iniciar sesión',
      EN: 'Sign in',
      DE: 'Anmelden',
      PT: 'Entrar',
      IT: 'Accedi',
    },
    register: {
      ES: 'Regístrate Gratis',
      EN: 'Sign Up Free',
      DE: 'Kostenlos registrieren',
      PT: 'Cadastre-se Grátis',
      IT: 'Registrati Gratis',
    },
    myTrips: {
      ES: 'Mis viajes',
      EN: 'My trips',
      DE: 'Meine Reisen',
      PT: 'Minhas viagens',
      IT: 'I miei viaggi',
    },
  },
  partners: {
    title: {
      ES: 'Conectados con las plataformas más confiables del mundo',
      EN: 'Connected with the most trusted platforms in the world',
      DE: 'Verbunden mit den vertrauenswürdigsten Plattformen der Welt',
      PT: 'Conectados com as plataformas mais confiáveis do mundo',
      IT: 'Collegati con le piattaforme più affidabili del mondo',
    },
    description: {
      ES: 'Más de 10,000 itinerarios creados con datos reales de precios, rutas y experiencias. Accede a las mejores opciones del mercado.',
      EN: 'More than 10,000 itineraries created with real data on prices, routes and experiences. Access the best options on the market.',
      DE: 'Über 10.000 Reiserouten mit echten Daten zu Preisen, Routen und Erlebnissen erstellt. Greifen Sie auf die besten Optionen auf dem Markt zu.',
      PT: 'Mais de 10.000 itinerários criados com dados reais de preços, rotas e experiências. Acesse as melhores opções do mercado.',
      IT: 'Oltre 10.000 itinerari creati con dati reali su prezzi, percorsi ed esperienze. Accedi alle migliori opzioni sul mercato.',
    },
  },
  testimonials: {
    title: {
      ES: 'Viajeros como tú que ya probaron',
      EN: 'Travelers like you who already tried',
      DE: 'Reisende wie Sie, die es bereits ausprobiert haben',
      PT: 'Viajantes como você que já experimentaram',
      IT: 'Viaggiatori come te che hanno già provato',
    },
  },
  faq: {
    title: {
      ES: 'Preguntas Frecuentes',
      EN: 'Frequently Asked Questions',
      DE: 'Häufig gestellte Fragen',
      PT: 'Perguntas Frequentes',
      IT: 'Domande Frequenti',
    },
    q1: {
      ES: '¿Cómo puede TravesIA planificar tu viaje completo en solo segundos?',
      EN: 'How can TravesIA plan your complete trip in just seconds?',
      DE: 'Wie kann TravesIA Ihre komplette Reise in nur wenigen Sekunden planen?',
      PT: 'Como TravesIA pode planejar sua viagem completa em apenas segundos?',
      IT: 'Come può TravesIA pianificare il tuo viaggio completo in pochi secondi?',
    },
    a1: {
      ES: 'TravesIA utiliza inteligencia artificial para analizar tus preferencias, presupuesto y destino, y generar en segundos un itinerario personalizado con vuelos, hospedajes, actividades, transporte y clima. Solo escribe tu idea —por ejemplo: "Quiero viajar a México con $800 durante 5 días"— y la IA hará el resto, entregándote una guía completa y organizada para tu viaje.',
      EN: 'TravesIA uses artificial intelligence to analyze your preferences, budget and destination, and generate in seconds a personalized itinerary with flights, accommodations, activities, transportation and weather. Just write your idea —for example: "I want to travel to Mexico with $800 for 5 days"— and the AI will do the rest, delivering a complete and organized guide for your trip.',
      DE: 'TravesIA verwendet künstliche Intelligenz, um Ihre Vorlieben, Ihr Budget und Ihr Reiseziel zu analysieren und in Sekunden eine personalisierte Reiseroute mit Flügen, Unterkünften, Aktivitäten, Transport und Wetter zu erstellen. Schreiben Sie einfach Ihre Idee —zum Beispiel: "Ich möchte mit $800 für 5 Tage nach Mexiko reisen"— und die KI erledigt den Rest und liefert Ihnen einen vollständigen und organisierten Reiseführer.',
      PT: 'TravesIA usa inteligência artificial para analisar suas preferências, orçamento e destino, e gerar em segundos um itinerário personalizado com voos, acomodações, atividades, transporte e clima. Basta escrever sua ideia —por exemplo: "Quero viajar para o México com $800 por 5 dias"— e a IA fará o resto, entregando um guia completo e organizado para sua viagem.',
      IT: 'TravesIA utilizza l\'intelligenza artificiale per analizzare le tue preferenze, budget e destinazione, e generare in pochi secondi un itinerario personalizzato con voli, alloggi, attività, trasporti e meteo. Scrivi semplicemente la tua idea —ad esempio: "Voglio viaggiare in Messico con $800 per 5 giorni"— e l\'IA farà il resto, fornendoti una guida completa e organizzata per il tuo viaggio.',
    },
    q2: {
      ES: '¿Qué tipo de información incluye el itinerario que crea TravesIA?',
      EN: 'What type of information does the TravesIA itinerary include?',
      DE: 'Welche Art von Informationen enthält die von TravesIA erstellte Reiseroute?',
      PT: 'Que tipo de informação o itinerário criado por TravesIA inclui?',
      IT: 'Che tipo di informazioni include l\'itinerario creato da TravesIA?',
    },
    a2: {
      ES: 'Cada itinerario generado por TravesIA incluye información práctica y actualizada sobre vuelos, opciones de alojamiento, actividades recomendadas, presupuesto estimado, clima, transporte local y consejos culturales. Todo se adapta a tus fechas, estilo de viaje y tipo de experiencia que buscas (romántica, aventura, descanso o cultural).',
      EN: 'Each itinerary generated by TravesIA includes practical and updated information about flights, accommodation options, recommended activities, estimated budget, weather, local transportation and cultural tips. Everything is adapted to your dates, travel style and type of experience you seek (romantic, adventure, relaxation or cultural).',
      DE: 'Jede von TravesIA erstellte Reiseroute enthält praktische und aktuelle Informationen über Flüge, Unterkunftsmöglichkeiten, empfohlene Aktivitäten, geschätztes Budget, Wetter, lokale Transportmittel und kulturelle Tipps. Alles wird an Ihre Daten, Ihren Reisestil und die Art der Erfahrung angepasst, die Sie suchen (romantisch, Abenteuer, Entspannung oder kulturell).',
      PT: 'Cada itinerário gerado por TravesIA inclui informações práticas e atualizadas sobre voos, opções de acomodação, atividades recomendadas, orçamento estimado, clima, transporte local e dicas culturais. Tudo é adaptado às suas datas, estilo de viagem e tipo de experiência que você procura (romântica, aventura, descanso ou cultural).',
      IT: 'Ogni itinerario generato da TravesIA include informazioni pratiche e aggiornate su voli, opzioni di alloggio, attività consigliate, budget stimato, meteo, trasporti locali e consigli culturali. Tutto è adattato alle tue date, stile di viaggio e tipo di esperienza che cerchi (romantica, avventura, relax o culturale).',
    },
  },
};

export const getTranslation = (key: string, language: Language): string => {
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    value = value[k];
    if (!value) return key;
  }
  
  return value[language] || value['ES'] || key;
};
