export interface ProductSection {
  heading: string;
  text: string;
  bullets?: string[];
}

export interface ProductPageContent {
  slug: string;
  title: string;
  category: string;
  intro: string;
  highlights: string[];
  benefits: string[];
  sections?: ProductSection[];
  advantageTitle?: string;
}

export const productPages: ProductPageContent[] = [
  {
    slug: "terrassenueberdachung",
    title: "Terrassenüberdachung",
    category: "Überdachungen",
    intro: "Unsere Terrassenüberdachungen stehen für höchste Qualität, modernes Design und maximale Langlebigkeit. Ausschließlich in Deutschland produziert, mit geprüfter Statik und eingebrannter Pulverbeschichtung.",
    highlights: ["Produktion Made in Germany", "Statisch geprüft inkl. Unterlagen", "5 Farboptionen ohne Aufpreis", "Eingebrannte Pulverbeschichtung"],
    benefits: ["Maximale Sicherheit & hohe Tragfähigkeit", "Wartungsarme Nutzung", "Ideal für Privat- und Gewerbekunden", "Zeitloses Design für jeden Baustil"],
    advantageTitle: "Ihre Vorteile auf einen Blick",
    sections: [
      {
        heading: "Hochwertige Materialien & geprüfte Statik",
        text: "Alle unsere Terrassenüberdachungen bestehen aus hochwertigen, statisch geprüften Aluminiumkonstruktionen. Jede Konstruktion wird mit offiziellen Statikberechnungen geliefert und ist für hohe Schnee- und Windlasten ausgelegt. Dadurch eignen sich unsere Systeme sowohl für private als auch für gewerbliche Anwendungen.",
        bullets: ["Maximale Sicherheit", "Hohe Tragfähigkeit", "Lange Lebensdauer", "Wartungsarme Nutzung"],
      },
      {
        heading: "Spezielle Ofenlackierung – langlebig & farbbeständig",
        text: "Unsere Terrassenüberdachungen sind mit einer speziellen, eingebrannten Ofenlackierung (Pulverbeschichtung) versehen. Diese hochwertige Beschichtung bietet einen hervorragenden Schutz und sorgt für eine dauerhaft schöne Oberfläche mit gleichmäßiger Farbstruktur – auch nach vielen Jahren.",
        bullets: ["Schutz vor Witterungseinflüssen", "UV-Strahlungsbeständig", "Korrosionsschutz", "Keine Farbverblassung"],
      },
      {
        heading: "5 Farboptionen – gleicher Preis, volle Freiheit",
        text: "Wir bieten Ihnen vier moderne Farbvarianten, die sich harmonisch in jede Architektur einfügen. Unabhängig von der Farbwahl bleibt der Preis gleich – es entstehen keine Mehrkosten. So haben Sie maximale Gestaltungsfreiheit, ohne Kompromisse beim Budget eingehen zu müssen.",
      },
      {
        heading: "Made in Germany – Qualität, auf die Sie sich verlassen können",
        text: "Die komplette Fertigung erfolgt in Deutschland unter strengen Qualitätskontrollen. 'Made in Germany' steht bei uns nicht nur für Herkunft, sondern für ein Qualitätsversprechen.",
        bullets: ["Präzise Verarbeitung", "Konstant hohe Produktqualität", "Kurze Lieferwege", "Verlässliche Standards"],
      },
      {
        heading: "Zeitloses Design & vielseitige Einsatzmöglichkeiten",
        text: "Dank des klaren, zeitlosen Designs passen unsere Terrassenüberdachungen zu modernen Neubauten, klassischen Einfamilienhäusern sowie Gastronomie- und Gewerbeobjekten. Sie schaffen zusätzlichen Wohnraum im Freien und erhöhen den Wert Ihrer Immobilie nachhaltig.",
        bullets: ["Moderne Neubauten", "Klassische Einfamilienhäuser", "Gastronomie & Gewerbe"],
      },
    ],
  },
  {
    slug: "wintergarten",
    title: "Wintergarten",
    category: "Überdachungen",
    intro: "Ein Wintergarten ist mehr als nur ein Anbau – er ist eine Investition in Lebensqualität, Komfort und den Wert Ihrer Immobilie. Unsere Wintergärten vereinen modernes Design, höchste Qualität und geprüfte Sicherheit – ausschließlich in Deutschland gefertigt.",
    highlights: ["Produktion Made in Germany", "Statisch geprüft inkl. Berichte", "5 Farboptionen ohne Aufpreis", "Ganzjährig nutzbar"],
    benefits: ["Mehr Wohnraum & natürliches Licht", "Pflegeleicht & wertbeständig", "Ideal für Privat- und Gewerbekunden", "Wertsteigerung der Immobilie"],
    advantageTitle: "Ihre Vorteile auf einen Blick",
    sections: [
      {
        heading: "Deutsche Produktion & geprüfte Statik – Sicherheit auf höchstem Niveau",
        text: "Unsere Wintergärten werden nach strengen deutschen Qualitätsstandards produziert und sind vollständig statisch geprüft. Zu jedem System erhalten Sie die erforderlichen Statikberichte, die eine sichere Nutzung unter verschiedensten Wetterbedingungen garantieren.",
        bullets: ["Hohe Schnee- und Windlasten", "Dauerhafte Belastung", "Langfristige Sicherheit"],
      },
      {
        heading: "Hochwertige Materialien & langlebige Konstruktion",
        text: "Wir setzen ausschließlich auf qualitativ hochwertige Aluminiumprofile, die sich durch ihre Stabilität, Langlebigkeit und Wartungsarmut auszeichnen. Die präzise Verarbeitung sorgt für eine perfekte Passform und eine dauerhaft stabile Konstruktion.",
      },
      {
        heading: "Spezielle eingebrannte Ofenlackierung",
        text: "Alle Wintergärten sind mit einer hochwertigen, im Ofen eingebrannten Pulverbeschichtung versehen. So bleibt Ihr Wintergarten auch nach vielen Jahren optisch und technisch in bestem Zustand.",
        bullets: ["Schutz vor Witterungseinflüssen", "UV-Strahlungsbeständig", "Korrosions- und Rostschutz", "Keine Farbveränderungen"],
      },
      {
        heading: "Ganzjähriger Wohnkomfort & vielseitige Nutzung",
        text: "Ein Wintergarten schafft zusätzlichen Wohnraum mit natürlichem Licht und angenehmem Raumklima. Ob als Wohn- oder Essbereich, Ruhe- und Leseecke, Pflanzenoase oder Erweiterung für Gastronomie – unsere Wintergärten passen sich flexibel Ihren Bedürfnissen an.",
        bullets: ["Wohn- oder Essbereich", "Ruhe- und Leseecke", "Pflanzenoase", "Erweiterung für Gastronomie"],
      },
      {
        heading: "Zeitloses Design & Wertsteigerung Ihrer Immobilie",
        text: "Dank des klaren, zeitlosen Designs fügt sich der Wintergarten harmonisch in jede Architektur ein – modern oder klassisch. Gleichzeitig steigert er nachhaltig den Wert Ihrer Immobilie und erhöht deren Attraktivität.",
      },
    ],
  },
  {
    slug: "bioclimatic-lamellendach",
    title: "Bioclimatic Lamellendach",
    category: "Lamellendächer",
    intro: "SKY FREE und SKY CLOUD – zwei Premium-Lamellendachsysteme, die neue Maßstäbe setzen. Vollständig öffnende oder drehbare Lamellen, Somfy-Motorisierung, 23 Farboptionen und extrem stabile Aluminiumkonstruktion.",
    highlights: ["Somfy Motor System", "23 exklusive Farben", "Vollständig öffnend (SKY FREE)", "Drehbare Lamellen (SKY CLOUD)"],
    benefits: ["Vier-Jahreszeiten-Komfort", "Erweiterbar mit Glas- & Seitenelementen", "Luxuriöse Optik", "Leise & langlebige Technik"],
    advantageTitle: "SKY FREE – die Klasse für sich",
    sections: [
      {
        heading: "SKY FREE – Vollständig zurückfahrbare Lamellen",
        text: "Das Herzstück von SKY FREE ist das vollständig nach hinten einfahrbare Lamellensystem. Im Gegensatz zu herkömmlichen Lamellendächern lassen sich die Aluminiumlamellen komplett sammeln, sodass der Himmel vollständig freigegeben wird. Bei Bedarf schließen Sie das Dach einfach per Somfy Motor und verwandeln Ihren Bereich in einen geschützten, wetterfesten Raum.",
        bullets: ["Vollständig öffnender Himmel", "Vier-Jahreszeiten-Komfort", "Regen- & Windschutz auf Knopfdruck"],
      },
      {
        heading: "Somfy Motorisierung & Fernbedienung",
        text: "Beide Systeme sind mit einem hochwertigen Somfy Motor ausgestattet und werden bequem per Fernbedienung gesteuert. Leise, kraftvoll und zuverlässig – die Bewegung der Lamellen erfolgt sanft, gleichmäßig und nahezu geräuschlos.",
      },
      {
        heading: "Extrem stabile Konstruktion – gebaut für Jahrzehnte",
        text: "Die Konstruktion arbeitet mit Edelstahlkomponenten, integrierten Lagern, hochwertigen Kupferlegierungsbuchsen und UV-beständigen ABS-Kunststoffen. Das speziell entwickelte Tensioned Scissor System sorgt für eine ruhige, gleichmäßige Öffnungs- und Schließbewegung.",
        bullets: ["Edelstahlkomponenten", "Integrierte Lager", "UV-beständige Kunststoffe", "Tensioned Scissor System"],
      },
      {
        heading: "Design ohne Einschränkungen – 23 Farben",
        text: "Während viele Anbieter ihre Kunden auf 1–2 Standardfarben beschränken, bietet SKY FREE 23 exklusive Farboptionen. Die Beschichtung erfolgt in unserer eigenen Spezial-Lackiererei mit strukturierter Pulverbeschichtung.",
      },
      {
        heading: "SKY CLOUD – Elegantes Lamellendach für stilvolle Terrassen",
        text: "SKY CLOUD ist ein hochwertiges System der Premiumklasse mit drehbaren Aluminium-Lamellen, die über ihre eigene Achse öffnen und schließen. So schaffen Sie jederzeit ein angenehmes Klima – optimale Belüftung, Licht und Schatten nach Bedarf. Ebenfalls mit Somfy-Motor und 23 Farboptionen.",
        bullets: ["Drehbare Lamellen für präzise Klimasteuerung", "Somfy Motor serienmäßig", "23 Farboptionen", "Kombinierbar mit Glassystemen & Seitenelementen"],
      },
    ],
  },
  {
    slug: "pergolen-systeme",
    title: "Pergolen Systeme",
    category: "Pergolen",
    intro: "Unsere Pergolen Systeme bieten weit mehr als herkömmliche Terrassenüberdachungen. Motorisiertes, vollständig öffnendes Dach, 10 Jahre Garantie auf Aluminiumteile und erweiterbar zum Wintergarten.",
    highlights: ["Motorisiertes öffnendes Dach", "Fernbedienung", "10 Jahre Garantie", "Erweiterbar zum Wintergarten"],
    benefits: ["Flexible Nutzung bei jedem Wetter", "Optimale Belüftung", "Privat & Gewerbe geeignet", "Wertsteigernde Investition"],
    advantageTitle: "Ihre Vorteile auf einen Blick",
    sections: [
      {
        heading: "Öffnen, schließen, genießen – volle Kontrolle per Knopfdruck",
        text: "Das motorisierte Lamellen- bzw. Tuchsystem lässt sich individuell öffnen und schließen und passt sich flexibel an Wetter und Bedürfnisse an. Ob Sonne, Schatten oder Schutz vor Regen – Sie bestimmen jederzeit selbst die Atmosphäre Ihres Außenbereichs.",
        bullets: ["Flexible Nutzung bei jedem Wetter", "Optimale Belüftung", "Höchsten Komfort & Bewegungsfreiheit"],
      },
      {
        heading: "Hochwertige Aluminiumkonstruktion mit 10 Jahren Garantie",
        text: "Alle tragenden Bauteile bestehen aus robustem Aluminium und werden mit einem speziellen Ofenlackierverfahren (Pulverbeschichtung) veredelt. 10 Jahre Garantie auf die lackierten Aluminiumteile unterstreichen die Premium-Qualität des Systems.",
        bullets: ["Extreme Witterungsbeständigkeit", "Korrosionsschutz", "Farbbrillanz über viele Jahre"],
      },
      {
        heading: "Vom Pergolensystem zum ganzjährigen Wintergarten",
        text: "Unsere Pergolen Systeme lassen sich problemlos zu einem komfortablen Wintergarten erweitern. Durch die Integration von Schiebe-Glassystemen oder Guillotine-Glassystemen entsteht ein geschützter, lichtdurchfluteter Wohnraum, der das ganze Jahr über genutzt werden kann.",
        bullets: ["Schiebe-Glassysteme integrierbar", "Guillotine-Glassysteme kombinierbar", "Ganzjahresnutzung"],
      },
      {
        heading: "Technische Highlights",
        text: "Modernste Technik für maximalen Komfort und lange Lebensdauer.",
        bullets: ["Motorisiertes, öffnendes Dachsystem", "Steuerung per Fernbedienung", "Stabile Aluminiumkonstruktion", "Pulverbeschichtung im Ofenlackierverfahren", "Ganzjahresnutzung möglich"],
      },
    ],
  },
  {
    slug: "carport",
    title: "Carport",
    category: "Carports",
    intro: "Als erfahrenes Unternehmen mit eigener Produktionsstätte fertigen wir hochwertige Carports aus verzinktem Stahl und Aluminium. Maßgeschneiderte Lösungen für private Wohnhäuser, Wohnanlagen und gewerbliche Objekte.",
    highlights: ["Eigene Produktionsstätte", "Verzinkter Stahl & Aluminium", "Maßanfertigung", "Einzel- & Doppelcarport"],
    benefits: ["Effektiver UV- & Witterungsschutz", "Optimale Luftzirkulation", "Reduzierte Korrosionsbildung", "Kurze Lieferzeiten als Hersteller"],
    advantageTitle: "Carports in Premium-Qualität",
    sections: [
      {
        heading: "Carports in Premium-Qualität – Schutz, der überzeugt",
        text: "Ein Carport schützt Ihr Fahrzeug effektiv vor Regen, Schnee, Hagel, Frost sowie intensiver UV-Strahlung. Dadurch werden Lack, Scheiben, Dichtungen und Innenraum langfristig geschont, was den Werterhalt Ihres Fahrzeugs deutlich erhöht. Im Vergleich zu geschlossenen Garagen sorgen unsere offenen Konstruktionen für eine optimale Luftzirkulation und reduzieren Feuchtigkeit sowie Korrosionsbildung.",
        bullets: ["Schutz vor Regen, Schnee & Hagel", "UV-Strahlungsschutz", "Optimale Luftzirkulation", "Reduzierung von Feuchtigkeit"],
      },
      {
        heading: "Geprüfte Materialien – maximale Stabilität",
        text: "In unserer eigenen Fertigung verwenden wir ausschließlich geprüfte, langlebige Materialien wie verzinkten Stahl und hochwertiges Aluminium. Jede Konstruktion wird präzise verarbeitet und entspricht höchsten Qualitäts- und Sicherheitsstandards.",
      },
      {
        heading: "Flexibel & individuell konfigurierbar",
        text: "Unsere Carports sind in verschiedenen Größen, Dachformen und Ausführungen erhältlich und können individuell an Ihre baulichen Gegebenheiten angepasst werden. Ob Einzel- oder Doppelcarport, freistehend oder wandmontiert – wir bieten maßgeschneiderte Lösungen.",
        bullets: ["Einzel- oder Doppelcarport", "Freistehend oder wandmontiert", "Verschiedene Dachformen", "Für Privat & Gewerbe"],
      },
    ],
  },
  {
    slug: "guillotine-glassysteme",
    title: "Guillotine-Glassysteme",
    category: "Glassysteme",
    intro: "Guillotine-Glassysteme vereinen modernes Design, intelligente Technik und höchsten Nutzungskomfort. Dank der vertikal beweglichen Glasflügel schaffen sie flexible, lichtdurchflutete Räume für Terrassen, Cafés, Restaurants, Hotels und Wintergärten.",
    highlights: ["Motorisiert – stufenlos bedienbar", "Gehärtetes Sicherheitsglas", "Integrierter Einklemmschutz", "Individuell konfigurierbar"],
    benefits: ["Ganzjährige Nutzung von Außenflächen", "Elegantes & modernes Erscheinungsbild", "Ideal für Gastronomie & Gewerbe", "Langlebig & wartungsarm"],
    advantageTitle: "Ihre Vorteile auf einen Blick",
    sections: [
      {
        heading: "Maximale Flexibilität auf Knopfdruck",
        text: "Die motorisierten Guillotine-Glassysteme lassen sich bequem per Knopfdruck bedienen. Die Glasflächen bewegen sich sanft und leise nach oben oder unten und ermöglichen eine stufenlose Öffnung. So entscheiden Sie jederzeit selbst über Frischluft, Schutz oder vollständige Transparenz.",
      },
      {
        heading: "Modernes Design trifft auf höchste Sicherheit",
        text: "Das System überzeugt nicht nur optisch, sondern erfüllt auch höchste Sicherheits- und Qualitätsstandards.",
        bullets: ["Hochwertiges gehärtetes Sicherheitsglas", "Robuste Aluminiumprofile", "Integrierte Einklemmschutz-Systeme", "Wind- und wetterbeständige Konstruktion"],
      },
      {
        heading: "Mehr Licht, mehr Raum – auch im Gastronomiebereich",
        text: "Durch die großflächigen Glasfronten entsteht ein offenes, helles Raumgefühl, das Ihre Umgebung optisch vergrößert. Besonders im Gastronomiebereich steigern Guillotine-Glassysteme die Aufenthaltsqualität Ihrer Gäste – und damit auch Ihren Umsatz.",
      },
      {
        heading: "Ideal für jede Jahreszeit",
        text: "So verwandeln Sie Ihre Terrasse in einen Ganzjahresbereich mit maximalem Mehrwert.",
        bullets: ["Schutz vor Wind, Regen und Kälte", "Optimale Belüftung im Sommer", "Ganzjährige Nutzung von Außenflächen"],
      },
      {
        heading: "Individuell anpassbar",
        text: "Unsere Guillotine-Glassysteme sind in verschiedenen Farben, Größen, Verglasungsoptionen und Automatisierungsstufen erhältlich und werden exakt auf Ihre Bedürfnisse zugeschnitten.",
      },
    ],
  },
  {
    slug: "vollkassettenmarkise",
    title: "Vollkassettenmarkise",
    category: "Markisen",
    intro: "Die Weinor Kubata – mehr als nur eine Markise, ein Statement moderner Architektur. Klares kubisches Design, integrierte LED-Beleuchtung und bewährte Tragrohrtechnik. Made in Germany.",
    highlights: ["Weinor Qualität Made in Germany", "Integrierte LED-Beleuchtung", "Kubisches Premium-Design", "Bewährte Tragrohrtechnik"],
    benefits: ["Modernes, eckiges Erscheinungsbild", "Höchste Stabilität & Langlebigkeit", "Stimmungsvolle Abendatmosphäre", "Wertsteigerung für Ihr Zuhause"],
    advantageTitle: "Kubata – Klare Architektur. Maximale Wirkung.",
    sections: [
      {
        heading: "Kubata – Klare Architektur. Maximale Wirkung.",
        text: "Die Kubata ist mehr als nur eine Markise – sie ist ein Statement moderner Architektur. Mit ihrem klaren, kubischen Design fügt sie sich perfekt in hochwertige, moderne Wohnkonzepte ein und unterstreicht den exklusiven Charakter anspruchsvoller Immobilien.",
      },
      {
        heading: "Weinor Qualität – Made in Germany",
        text: "Als Qualitätsprodukt des renommierten deutschen Herstellers Weinor, der sich seit Jahrzehnten im Markisenbereich bewährt und zahlreiche Auszeichnungen erhalten hat, steht die Kubata für absolute Premiumqualität. Robust, langlebig und bis ins Detail durchdacht – eine Investition, die sich langfristig auszahlt.",
      },
      {
        heading: "Technische Exzellenz & bewährte Tragrohrtechnik",
        text: "Dank der bewährten Tragrohrtechnik überzeugt die Kubata nicht nur optisch, sondern auch technisch. Die Montage ist schnell und sicher, die Konstruktion extrem stabil und widerstandsfähig – selbst bei anspruchsvollen Wetterbedingungen. Die zuverlässige Wasserentwässerung sorgt zusätzlich für Schutz und Langlebigkeit.",
      },
      {
        heading: "Integrierte LED-Beleuchtung für Abendambiente",
        text: "Ein besonderes Highlight sind die integrierten LED-Leuchten, die die Kubata auch in den Abendstunden perfekt in Szene setzen. Sie schaffen eine stimmungsvolle Atmosphäre und verwandeln Terrasse oder Balkon in einen luxuriösen Wohlfühlbereich – ideal für entspannte Abende und stilvolle Begegnungen.",
      },
    ],
  },
  {
    slug: "glas-schiebesysteme",
    title: "Glas-Schiebesysteme",
    category: "Glassysteme",
    intro: "KT-APT und BORA – zwei Systeme für Kaltwintergärten mit 10mm ESG-Sicherheitsglas, Maßanfertigung, hoher Dichtigkeit und präziser Führung. Sicherheit für die ganze Familie, Komfort für jede Jahreszeit.",
    highlights: ["10 mm ESG-Sicherheitsglas", "Maßanfertigung (keine Standardmaße)", "Roto Marken-Schließsystem", "4 Aluminiumprofilfarben"],
    benefits: ["Leichtgängige, ruhige Bewegung", "Wärme- & Windschutz", "Geeignet für Isolierglas bis 18 mm", "Sicher auch für Haushalte mit Kindern"],
    advantageTitle: "KT-APT & BORA – Maßgeschneiderte Qualität",
    sections: [
      {
        heading: "KT-APT – Maßgeschneiderte Qualität und Sicherheit",
        text: "Unsere Glas-Schiebesysteme sind die ideale Lösung für Kaltwintergärten und überzeugen durch modernes Design, hohe Funktionalität und maximale Sicherheit. Das System besteht aus 10 mm starkem ESG-Sicherheitsglas und wird individuell nach Maß für jeden Kunden gefertigt – es gibt keine festen Standardmaße.",
        bullets: ["10 mm ESG-Sicherheitsglas", "Individuelle Maßanfertigung", "30 mm Überlappung für Stabilität", "4 Aluminiumprofilfarben ohne Aufpreis"],
      },
      {
        heading: "Höchste Sicherheit – auch für Familien mit Kindern",
        text: "Durch die 10 mm Glasstärke ist das ESG-Glas besonders bruchfest. Sollte es dennoch zu einem Bruch kommen, zerfällt das Glas in kleine, stumpfe Teile und minimiert das Verletzungsrisiko. Kinder können unbeschwert spielen, während die ganze Familie den Wintergarten entspannt genießt.",
      },
      {
        heading: "BORA – Technische Präzision trifft höchsten Wohnkomfort",
        text: "Die BORA Schiebeglassysteme stehen für innovative Technik, herausragende Qualität und modernen Wohnkomfort. Gläser mit 8 mm, 10 mm sowie 18 mm Isolierglas können problemlos integriert werden. Das weltweit bewährte Roto-Marken-Schließsystem erlaubt den Einsatz von bis zu 1,5 Meter breiten Paneelen.",
        bullets: ["8 mm, 10 mm & 18 mm Isolierglas möglich", "Roto-Laufräder für leichten Lauf", "Bis zu 1,5 m breite Paneele", "Hohe Dichtigkeit gegen Regen & Wind"],
      },
    ],
  },
  {
    slug: "sonnenschutz",
    title: "Senkrechtmarkisen",
    category: "Markisen",
    intro: "ZIP-Screen-Systeme für effektiven Sonnen- und Hitzeschutz mit innovativer ZIP-Führungstechnologie, hoher Windstabilität und Smart-Home-Integration. Ideal für Fensterflächen, Glasfassaden, Pergolen und Terrassen.",
    highlights: ["ZIP-Reißverschluss-Technologie", "UV-Schutz bis 95 %", "Smart-Home-fähig", "Motorisiert & windstabil"],
    benefits: ["Angenehmes Raumklima", "Weniger Aufheizung der Innenräume", "Energieeinsparung", "Ideal für private & gewerbliche Nutzung"],
    advantageTitle: "Ihre Vorteile auf einen Blick",
    sections: [
      {
        heading: "Effektiver Sonnen- und Hitzeschutz",
        text: "Zip Screen Systeme reduzieren die Sonneneinstrahlung und Hitze deutlich, ohne den Blick nach außen vollständig zu blockieren.",
        bullets: ["Angenehmes Raumklima", "Weniger Aufheizung der Innenräume", "Reduzierter Energieverbrauch für Klimatisierung"],
      },
      {
        heading: "ZIP-Technologie – Stabilität bei jedem Wetter",
        text: "Dank der seitlich verschweißten Reißverschlussführung bietet der Zip Screen hohe Windstabilität, geräuscharmen Lauf und perfekte Spannung über die gesamte Fläche. Ideal für exponierte Lagen und große Glasflächen.",
        bullets: ["Hohe Windstabilität", "Geräuscharmer Lauf", "Kein Ausfädeln des Gewebes", "Perfekte Spannung über die gesamte Fläche"],
      },
      {
        heading: "Komfortable Bedienung & intelligente Steuerung",
        text: "Zip Screen Systeme sind erhältlich mit Elektromotor, Funksteuerung, Sonnen- und Windsensoren sowie Smart-Home-Integration. Automatische Steuerung sorgt für optimalen Schutz – ganz ohne manuelles Eingreifen.",
        bullets: ["Elektromotor", "Funksteuerung", "Sonnen- und Windsensoren", "Smart-Home-Integration"],
      },
      {
        heading: "Hochwertige Screen-Gewebe",
        text: "Unsere Zip Screens verwenden speziell entwickelte Hightech-Gewebe. So behalten Sie Tageslicht und Privatsphäre in perfektem Gleichgewicht.",
        bullets: ["UV-Schutz bis zu 95 %", "Hohe Reißfestigkeit", "Witterungs- und UV-Beständigkeit", "Unterschiedliche Transparenzstufen"],
      },
    ],
  },
  {
    slug: "oberdachmarkise",
    title: "Oberdachmarkise",
    category: "Markisen",
    intro: "Die Oberdachmarkise wird oberhalb der Glasfläche montiert und bietet effektiven Schutz vor Hitze und intensiver Sonneneinstrahlung, noch bevor sie ins Innere gelangt. Mit Somfy-Motor, Serge Ferrari Stoffen und 4 Gestellfarben.",
    highlights: ["Somfy Motor", "Serge Ferrari Outdoor-Stoffe", "4 Gestellfarben", "Oberhalb der Glasfläche montiert"],
    benefits: ["Effektive Hitze- & Sonnenreduktion", "Langlebig & witterungsbeständig", "Stufenlos positionierbar", "Komfort vom Sitzplatz aus"],
    advantageTitle: "Mehr Lebensqualität im Außenbereich",
    sections: [
      {
        heading: "Maximale Wirkung gegen Hitze & Sonne",
        text: "Gerade bei Glasdächern entsteht schnell ein Hitzestau. Unsere Oberdachmarkise reduziert die Sonneneinstrahlung deutlich und sorgt für ein angenehm kühles Klima unter Ihrer Überdachung. So verwandeln Sie Ihre Terrasse oder Ihren Wintergarten in einen echten Wohlfühlort – selbst an heißen Sommertagen.",
      },
      {
        heading: "Hochwertige Materialien & durchdachte Technik",
        text: "Die Markise besteht aus robustem, pulverbeschichtetem Aluminium. Das Markisentuch besteht aus hochwertigen Outdoor-Stoffen von Serge Ferrari: UV-beständig, schmutzabweisend, formstabil und besonders langlebig.",
        bullets: ["UV-beständig", "Schmutzabweisend", "Formstabil", "Besonders langlebig"],
      },
      {
        heading: "Komfortable Bedienung mit Somfy Motor",
        text: "Für maximalen Komfort ist die Oberdachmarkise mit einem hochwertigen Somfy-Motor ausgestattet. Stufenloses Ein- und Ausfahren, individuelle Positionierung und einfache Bedienung vom Sitzplatz aus.",
      },
      {
        heading: "Gestellfarben & Stoffauswahl",
        text: "Wählen Sie aus 4 Gestellfarben (RAL 9016 Weiß, RAL 7016 Anthrazit, RAL 9007 Metallic Grau, RAL 9005 Schwarz) und 8 exklusiven Stofffarben – perfekt auf Ihre Terrasse abgestimmt.",
        bullets: ["RAL 9016 Weiß", "RAL 7016 Anthrazit", "RAL 9007 Metallic Grau", "RAL 9005 Schwarz"],
      },
    ],
  },
  {
    slug: "unterglasmarkise",
    title: "Unterglasmarkise",
    category: "Markisen",
    intro: "Die AC Premium Bau Unterglasmarkise vereint modernes Design, innovative Technik und höchste Qualität. Speziell für unsere Dachsysteme entwickelt, mit Somfy-Motor, 10 Stofffarben und dauerhaft hoher Tuchspannung durch integrierte Gasdruckfeder.",
    highlights: ["Somfy Motor System", "10 Stofffarben", "Integrierte Gasdruckfeder", "Innovativer Montageriegel"],
    benefits: ["Dauerhaft hohe Tuchspannung", "Ruhiger, gleichmäßiger Lauf", "Vereinfachte Direktmontage", "Stufenlose Positionierung per Fernbedienung"],
    advantageTitle: "Mehr Lebensqualität auf Ihrer Terrasse",
    sections: [
      {
        heading: "Stabilität & Technik auf höchstem Niveau",
        text: "Unsere Unterglasmarkisen überzeugen durch ihre außergewöhnliche Stabilität und langlebige Konstruktion. Dank des perfekt abgestimmten Zusammenspiels von Zip-Profil, Zugband und Gasdruckfeder wird eine dauerhaft hohe Tuchspannung gewährleistet. Mit unserem innovativen Montageriegel ermöglichen wir eine deutlich vereinfachte und sichere Direktmontage.",
      },
      {
        heading: "Große Stoffauswahl – 10 moderne Farbvarianten",
        text: "Unsere exklusive Tuchkollektion bietet Ihnen 10 hochwertige Stofffarben, die individuell auf Ihre Terrassengestaltung abgestimmt werden können. So schaffen Sie nicht nur optimalen Sonnenschutz, sondern auch ein harmonisches Gesamtbild.",
      },
      {
        heading: "Standard Aluminium-Farben (Pulverbeschichtet)",
        text: "Die Aluminiumkassette liefern wir seriенmäßig in eleganten RAL-Farben. Das verwendete Aluminium ist besonders langlebig, witterungsbeständig und pflegeleicht.",
        bullets: ["RAL 7016 ST (Anthrazit)", "RAL 9007 ST (Graualu)", "RAL 9006 ST (Weißaluminium)", "RAL 8014 ST (Sepiabraun)", "RAL 9010 (Reinweiß)"],
      },
      {
        heading: "Komfort auf Knopfdruck – Somfy Motorisierung",
        text: "Ausgestattet mit einem hochwertigen Somfy Motor-System lässt sich die Unterglasmarkise bequem per Fernbedienung steuern. Sie bedienen Ihre Markise vom Sitzplatz aus, stoppen sie in jeder gewünschten Position und genießen maximalen Bedienkomfort – ohne Kraftaufwand.",
      },
    ],
  },
  {
    slug: "eingangsvordach",
    title: "Eingangsvordach",
    category: "Überdachungen",
    intro: "Unser Eingangsvordach aus Aluminium vereint modernes Design, hohe Funktionalität und langlebige Qualität. Nach deutschen Statik- und Qualitätsstandards gefertigt, mit ofengehärteter Pulverbeschichtung und 5 Farbvarianten.",
    highlights: ["Aluminiumkonstruktion", "5 Farbvarianten", "Ofengehärtete Pulverbeschichtung", "Deutsche Statik- & Qualitätsnormen"],
    benefits: ["Zuverlässiger Wetterschutz", "Optische Aufwertung des Eingangs", "Korrosions- & UV-bestandig", "Wertsteigerung der Immobilie"],
    advantageTitle: "Ihre Vorteile auf einen Blick",
    sections: [
      {
        heading: "Hochwertiger Wetterschutz für Ihren Hauseingang",
        text: "Unser Eingangsvordach aus Aluminium wurde speziell entwickelt, um Hauseingange zuverlässig vor Regen und Witterungseinflüssen zu schützen und gleichzeitig den Eingangsbereich optisch aufzuwerten. Es wird nach deutschen Statik- und Qualitätsstandards gefertigt und bietet maximale Stabilität und Sicherheit.",
      },
      {
        heading: "Langlebige Oberfläche",
        text: "Die Oberfläche ist mit einem hochwertigen, ofengehärteten Lacksystem (Pulverbeschichtung) veredelt, das besonders widerstands-fähig gegen Korrosion, UV-Strahlung und äußere Einflüsse ist. Für eine perfekte Anpassung an die Fassade stehen 5 verschiedene Farboptionen zur Auswahl.",
        bullets: ["Korrosionsschutz", "UV-Strahlung bestandig", "Ofengehärtete Pulverbeschichtung", "5 Farboptionen ohne Aufpreis"],
      },
      {
        heading: "Schutz & Komfort zugleich",
        text: "Das Eingangsvordach wird oberhalb der Haustür montiert und sorgt dafür, dass Sie und Ihre Gäste auch an regnerischen Tagen trocken bleiben – sei es beim Aufschließen der Tür oder beim kurzen Warten vor dem Eintreten. Es bietet nicht nur Schutz, sondern erhöht auch den Komfort und den Wert Ihrer Immobilie.",
      },
    ],
  },
];

export const productPageBySlug = Object.fromEntries(productPages.map((item) => [item.slug, item])) as Record<string, ProductPageContent>;
