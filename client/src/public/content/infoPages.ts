export interface InfoSection {
  title: string;
  body: string[];
}

export interface InfoPageContent {
  eyebrow: string;
  title: string;
  description: string;
  sections: InfoSection[];
}

export const companyPage: InfoPageContent = {
  eyebrow: "Unternehmen",
  title: "Über AC Premium Bau",
  description:
    "AC Premium Bau plant und realisiert hochwertige Überdachungs- und Outdoor-Living-Lösungen mit Fokus auf Präzision, Langlebigkeit und fachgerechte Montage.",
  sections: [
    {
      title: "Leistungsspektrum",
      body: [
        "Terrassenüberdachungen, Wintergärten, Lamellendächer, Pergolen, Carports und passende Beschattungssysteme werden projektbezogen geplant.",
        "Die Ausrichtung bleibt klar: maßgefertigte Lösungen mit hochwertiger Ausführung und abgestimmter Montage.",
      ],
    },
    {
      title: "Standorte",
      body: [
        "Hauptsitz: Bertholdweg 9, 72768 Reutlingen.",
        "Büro: Alte Landstraße 42, 72072 Tübingen.",
      ],
    },
    {
      title: "Anspruch",
      body: [
        "Im Mittelpunkt stehen geprüfte Systeme, klare Gestaltung, hohe Materialqualität und eine belastbare Projektabwicklung.",
        "Die öffentliche Website wird schrittweise in eine vollständig mehrsprachige Struktur überführt.",
      ],
    },
  ],
};

export const imprintPage: InfoPageContent = {
  eyebrow: "Rechtliches",
  title: "Impressum",
  description: "Angaben gemäß § 5 TMG für AC Premium Bau.",
  sections: [
    {
      title: "Anbieter",
      body: [
        "Ugur Acun",
        "AC Premium Bau",
        "Bertholdweg 9",
        "72768 Reutlingen",
      ],
    },
    {
      title: "Kontakt",
      body: [
        "Telefon: +49 7071 8826970",
        "Mobil: +49 151 64013410",
        "E-Mail: acun@acpremiumbau.de",
        "Umsatzsteuer-ID: DE449516879",
      ],
    },
    {
      title: "Verantwortlich",
      body: [
        "Redaktionell verantwortlich: AC Premium Bau, Ugur Acun, Bertholdweg 9, 72768 Reutlingen.",
        "EU-Streitschlichtung: https://ec.europa.eu/consumers/odr/.",
        "Nicht bereit oder verpflichtet zur Teilnahme an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle.",
      ],
    },
  ],
};

export const privacyPage: InfoPageContent = {
  eyebrow: "Rechtliches",
  title: "Datenschutzerklärung",
  description: "Vorläufig strukturierte Datenschutzseite mit den zentralen Themen der späteren vollständigen DSGVO-Fassung.",
  sections: [
    {
      title: "Allgemeine Hinweise",
      body: [
        "Diese Website verarbeitet technische Zugriffsdaten, Formularangaben und notwendige Sicherheitsinformationen nur im erforderlichen Umfang.",
        "Die endgültige Fassung wird an die produktive Infrastruktur, Consent-Logik und eingebundene Dienste angepasst.",
      ],
    },
    {
      title: "Server und Sicherheit",
      body: [
        "Zum Schutz der Plattform werden Sicherheitsheader, Session-Cookies und technische Schutzmaßnahmen gegen missbräuchliche Zugriffe eingesetzt.",
        "Interne Bereiche werden zusätzlich für Indexierung gesperrt und restriktiver behandelt.",
      ],
    },
    {
      title: "Kontaktanfragen",
      body: [
        "Bei einer Kontakt- oder Angebotsanfrage werden die übermittelten Daten ausschließlich zur Bearbeitung des jeweiligen Anliegens verwendet.",
        "Weitere Angaben zu Speicherdauer, Rechtsgrundlagen und Empfängern folgen mit der finalen Datenschutzerklärung.",
      ],
    },
  ],
};

export const termsPage: InfoPageContent = {
  eyebrow: "Rechtliches",
  title: "Allgemeine Geschäftsbedingungen Konzept Terrasse",
  description: "Allgemeine Geschäftsbedingungen der AC Premium Bau für Angebote, Lieferungen und Montagen.",
  sections: [
    {
      title: "1. Vorbemerkungen",
      body: [
        "1.1. Der Auftraggeber erkennt mit der Erteilung des umstehenden Auftrages die nachfolgenden Allgemeinen Geschäftsbedingungen des Auftragnehmers, insbesondere über Preise, Lieferung, Zahlung, Rücktritt vom Vertrag und Schadensersatz uneingeschränkt an.",
        "1.2. Bezüglich des umstehenden Lieferauftrages ergibt sich der Umfang aus der Vertragsurkunde (Auftrag), eventuellen Verkaufs- und technischen Unterlagen soweit diese vom Auftragnehmer dem Auftraggeber zur Verfügung gestellt wurden.",
        "1.3. Soweit der umstehende Auftrag Grundstücke betrifft, so versichert der Auftraggeber mit seiner Unterschrift unter der Vertragsurkunde (Auftrag), dass er Eigentümer des den Auftrag betreffenden Grundstückes ist bzw. dass er vom Eigentümer bevollmächtigt wurde, den umstehenden Auftrag zu erteilen.",
      ],
    },
    {
      title: "2. Auftragsausführung",
      body: [
        "2.1. Die Auftragsausführung bzw. Lieferung erfolgt an dem vom Auftraggeber genannten Ort. Für etwaige Genehmigungen ist der Auftraggeber selbst zuständig, soweit nichts anderes vereinbart wurde.",
        "2.2. Der Kunde ist verpflichtet folgende Punkte durch einen Statiker prüfen zu lassen und zu bestätigen. – Statik der Dachsparren bauseits. – Grenzpunkte bauseits.",
      ],
    },
    {
      title: "3. Preise",
      body: [
        "3.1. Soweit zwischen Auftraggeber und Auftragnehmer keine festen Preise vereinbart wurden, werden die Preise auf Grundlage, der am Tag der Auftragsausführung bzw. Lieferung gültigen Preise berechnet. Die Preise beinhalten die zum Zeitpunkt des Vertragsschlusses gültige Mehrwertsteuer. Ändert sich die Mehrwertsteuer nach Vertragsschluss, so wird der Rechnung die Mehrwertsteuer, welche zum Zeitpunkt der Vertragsdurchführung gültig ist, zu Grunde gelegt.",
        "3.2. Die Auftragsbestätigung ist nur gültig, wenn die vertraglich vereinbarte Anzahlung in Höhe von 30% geleistet worden ist.",
        "3.3. Sollte die Anzahlung innerhalb von 14 Tagen nicht geleistet worden sein, nimmt sich der Auftragnehmer das Recht vom Vertrag zurückzutreten.",
      ],
    },
    {
      title: "4. Rücktritt vom Vertrag, Kündigung, Schadenersatz und Gewährleistung",
      body: [
        "4.1. Sofern der Auftraggeber vor Fertigung des in Auftrag gegebenen Werkes vom Vertrag zurücktritt bzw. diesen kündigt, so ist der Auftragnehmer berechtigt, eine Entschädigung in Höhe von 30% des Auftragswertes zu beanspruchen, es sei denn, der Auftraggeber weist nach, dass der dem Auftragnehmer entstandene Schaden niedriger ist oder kein Schaden entstanden ist.",
        "4.2. Verweigert der Auftraggeber die Abnahme nach Fertigung der Bauteile bzw. des Werkes, schuldet der Auftraggeber dem Auftragnehmer bei Lieferung von Bauteilen ohne Montage 100% des Gesamtauftragswertes und bei Lieferung und Montage 90% des Gesamtauftragswertes. Dem Auftraggeber ist es unbenommen, weitergehende Schadensersatzansprüche geltend zu machen. Diese werden von dieser Vereinbarung nicht berührt.",
        "4.3. Sollte beim Montageprozess festgestellt werden, dass die Auftragsausführung bzw. die Montage aus technischen Gründen in der vorgesehenen Art und Weise nicht möglich ist, welche der Auftragnehmer nicht zu vertreten hat, so hat der Auftragnehmer ein Recht zum Vertragsrücktritt, ohne dass der Auftraggeber berechtigt ist, Schadensersatzansprüche geltend zu machen, es sei denn, der Auftragnehmer oder dessen Erfüllungsgehilfen haben den Schaden grob fahrlässig oder vorsätzlich verursacht oder es liegt eine Körperverletzung vor.",
        "4.4. Auf die Konstruktion der Terrassenüberdachung und die Pulverbeschichtung gibt der Auftragnehmer eine Garantie von 5 Jahren. Auf elektrische Bauteile wie Beleuchtungen und Leuchten sowie Sonnenschutzsysteme für Beschattungen gilt eine Garantie von 2 Jahren. Silikondichtungen sollten je nach Wetterbedingungen vom Auftraggeber auf Dichtheit kontrolliert und gegebenenfalls nachgezogen werden.",
      ],
    },
    {
      title: "5. Eigentumsvorbehalt",
      body: [
        "Bis zur vollständigen Bezahlung des Gesamtauftragswertes bleiben die vom Auftragnehmer gelieferten Waren und Bauteile Eigentum des Auftragnehmers. Auftraggeber und Auftragnehmer sind sich auch darüber einig, dass dieses auch gilt bei Montage der gelieferten Ware. Der Auftraggeber und der Auftragnehmer sind sich darüber einig, dass eine unzertrennbare Verbindung des vom Auftragnehmer gelieferten Werkes mit dem Grundstück bzw. Gebäude des Auftraggebers oder eines Dritten durch die Montage der Waren und Bauteile des Auftragnehmers nicht entsteht. Der Eigentumsvorbehalt bleibt auch bei Verjährung der Forderung des Auftragnehmers bestehen.",
      ],
    },
    {
      title: "6. Bezahlung",
      body: [
        "Bei der Vertragsunterzeichnung werden 30% und bei Abschluss des Auftrages 70% des Auftragswertes fällig.",
        "6.1. Gegen die Ansprüche des Auftragnehmers kann der Auftraggeber mit Gegenansprüchen nur dann aufrechnen, wenn diese rechtskräftig festgestellt oder vom Auftragnehmer anerkannt sind.",
        "6.2. Bitte beachten Sie, dass bei verschiedenen Produkten auch separate Aufträge erstellt werden. Diese werden unabhängig voneinander verarbeitet und für jeden separaten Auftrag wird eine Rechnung versendet.",
      ],
    },
    {
      title: "7. Auftragsausführung",
      body: [
        "7.1. Bei der Auftragsausführung hat der Auftraggeber die Pflicht, dafür Sorge zu tragen, dass für die Auftragsausführung notwendige Genehmigungen, wie beispielsweise Baugenehmigungen etc., vorliegen. Weiterhin obliegt es dem Auftraggeber, für eine ordnungsgemäße Zuwegung zu sorgen. Der Auftraggeber ist auch verpflichtet, dafür zu sorgen, dass zum Zeitpunkt der vereinbarten Auftragsausführung die bauseits notwendigen baulichen Voraussetzungen gegeben sind, damit eine ordnungsgemäße Auftragsausführung möglich ist. Der Auftraggeber hat auch dafür Sorge zu tragen, Markisen, Vordächer, Fenster u. a. bauliche Einrichtungen vor der Auftragsausführung so zu schützen, dass jede Form der Beschädigung ausgeschlossen ist. Der Auftraggeber ist auch verpflichtet, die notwendigen Vorbereitungen zur Auftragsausführung selbst durchzuführen bzw. zu veranlassen, wie beispielsweise die Beseitigung von Regen- und Wasserfallrohren, Leitungen und Rollläden, Blitzschutzanlagen etc. Kann beim vereinbarten Termin der Auftragsausführung bei Eintreffen der Ausführenden durch Umstände, die der Auftraggeber zu vertreten hat, die Auftragsausführung nicht erfolgen, so ist der Auftraggeber verpflichtet, die hieraus entstandenen Kosten (Fahrtkosten und Stundenlöhne etc.) zu übernehmen.",
        "7.2. Der Auftraggeber hat dafür Sorge zu tragen, dass zum vereinbarten Termin der Auftragsausführung Strom, Wasser und Toilettenbenutzung sichergestellt sind. Kommt der Auftraggeber diesen Anforderungen nicht nach, muss er die Kosten für deren Bereitstellung übernehmen.",
        "7.3. Die Haftung des Auftragnehmers für Schäden bei der Auftragsausführung im Haus oder an anderen Gegenständen des Auftraggebers oder Dritter ist auf Seiten des Auftragnehmers auf Vorsatz bzw. grobe Fahrlässigkeit beschränkt. Nur im Falle grober Fahrlässigkeit oder Vorsatz hat der Auftragnehmer oder von ihm beauftragte Dritte für Schäden beim Auftraggeber einzustehen. Dem Auftraggeber wird ausdrücklich erklärt, dass bei Ausführung des Auftrages auf direktem Bodenbelag Schäden wie der Bruch einer Fliese entstehen können und der Auftragnehmer hierfür nicht einsteht. Nach Ausführung ist der Auftragnehmer nicht verpflichtet, Glaselemente zu reinigen. Bei Kaltwintergärten besteht die Möglichkeit, dass bei Starkregen über die Glasschiebeelemente Regenwasser eindringen kann. Abflusselemente müssen regelmäßig auf Blockaden kontrolliert werden.",
        "7.4. Der Anschluss von elektrisch betriebenen Liefergütern (bspw. LED-Beleuchtung, Heizstrahler, Elektromotoren von Markisenanlagen etc.) ist kein Auftragsinhalt der Firma Konzept Terrasse und darf nicht durch diese ausgeführt werden. Es gehört zu den Aufgaben des Käufers, dies entsprechend zu beauftragen.",
      ],
    },
    {
      title: "8. Abnahme",
      body: [
        "Mit der Fertigstellung der Werkleistung des Auftragnehmers gilt diese als abgenommen. Kleine und unwesentliche Mängel (beispielsweise Farbabweichungen) beeinflussen die Abnahme nicht.",
        "8.1. Der Auftragnehmer übernimmt die Gewährleistung dafür, dass die Leistung zum Zeitpunkt der Abnahme die vertraglich vereinbarten Eigenschaften hat, den anerkannten Regeln der Technik entspricht und nicht mit Fehlern behaftet ist, die den Wert oder die Tauglichkeit zu dem üblichen Gebrauch aufheben oder mindern.",
        "8.2. Der Auftragnehmer übernimmt die Gewähr nur für Leistungen, die von ihm oder einem von ihm beauftragten Dritten durchgeführt werden. Für Leistungen, die der Auftragnehmer nicht selbst oder durch einen von ihm beauftragten Dritten durchgeführt hat, wird keine Gewährleistung übernommen.",
        "8.3. Mit der Abnahme bestätigt der Auftraggeber, dass das ausgeführte Werk und die gelieferten Bauteile und Materialien in einwandfreiem Zustand sind und das Werk als vertragsgemäß abgenommen wird. Vor der Abnahme ist der Auftraggeber verpflichtet, das ausgeführte Werk auf Mängel zu untersuchen, die erkennbar und offensichtlich sind bzw. bei gründlicher und sorgfältiger Untersuchung hätten erkannt werden können. Mängel, die bei sorgfältiger Untersuchung des Werkes vor Abnahme hätten erkannt werden können, können nachträglich nicht mehr gerügt werden.",
        "8.4. Beim Vorhandensein von Mängeln kann der Auftraggeber Nacherfüllung verlangen. Für die Nacherfüllung ist dem Auftragnehmer eine Frist von mindestens 5 Wochen einzuräumen. Bei der Nachlieferung kann der Auftragnehmer nach seiner Wahl entscheiden, ob er die Mangelbeseitigung oder die Ersatzlieferung wählt. Ist die Nacherfüllung mit unverhältnismäßigen Kosten verbunden, kann der Auftragnehmer die Nacherfüllung verweigern.",
        "8.5. Kommt der Auftragnehmer seinen vorgenannten Pflichten, insbesondere der Nacherfüllungspflicht, innerhalb der Frist nicht nach oder schlägt die Nachbesserung fehl, kann der Auftraggeber eine angemessene Herabsetzung der Vergütung verlangen. Der Vertragsrücktritt ist ausgeschlossen. Ebenfalls ausgeschlossen ist die Ersatzvornahme durch den Auftraggeber auf Kosten des Auftragnehmers.",
        "8.6. Ist zwischen Auftraggeber und Auftragnehmer vereinbart, dass der Auftraggeber die Montage der gelieferten Bauteile ganz oder teilweise übernimmt, so entfällt die Haftung und Gewährleistung für die Montage. Sofern der Auftraggeber die gelieferten und/oder eingebauten Bauteile verändert, diese unsachgemäß gebraucht oder in sonstiger Weise verändert bzw. Anbauten vornimmt, entfällt die Gewährleistung seitens des Auftragnehmers ebenfalls.",
        "8.7. Weitergehende Schadensersatzansprüche des Auftraggebers gegen den Auftragnehmer sowie von ihm beauftragte Dritte wegen sonstiger Pflichtverletzungen aus dem Vertrag sowie aus unerlaubter Handlung sind ausgeschlossen, es sei denn, diese beruhen auf Vorsatz oder grober Fahrlässigkeit oder es liegt eine Körperverletzung oder eine Verletzung der Gesundheit vor.",
        "8.8. Mit der Abnahme der Werkleistung des Auftragnehmers erklärt sich der Auftraggeber damit einverstanden, dass Bilder/Videos der Montage und des fertigen Produktes gemacht werden dürfen. Diese Bilder dürfen anschließend über die Social-Media-Kanäle des Auftraggebers und Auftragnehmers veröffentlicht werden. Personen werden nicht gezeigt. Sollte der Auftraggeber damit nicht einverstanden sein, so muss er seinen Widerspruch schriftlich oder per E-Mail dem Auftragnehmer mitteilen.",
      ],
    },
    {
      title: "9. Ergänzende oder vom Vertrag abweichende Vereinbarungen",
      body: [
        "Ergänzende oder vom Vertrag abweichende Vereinbarungen sind für den Auftragnehmer nur dann bindend, wenn diese vom Auftragnehmer schriftlich bestätigt sind.",
      ],
    },
    {
      title: "10. Salvatorische Klauseln",
      body: [
        "Sollten einzelne Bestimmungen dieses Vertrages nicht rechtwirksam sein oder ihre Rechtswirksamkeit später verlieren, wird die Wirksamkeit der übrigen Bestimmungen hiervon nicht berührt. Anstelle unwirksamer Vereinbarungen oder Lücken im Vertrag, treten Bestimmungen, die dem Parteiwillen am nächsten kommen.",
      ],
    },
    {
      title: "11. Haftung",
      body: [
        "Die Haftung des Auftragnehmers gegenüber dem Auftraggeber für seine gesetzlichen Vertreter, Erfüllungsgehilfen oder Betriebsangehörigen wird außer in den Fällen des Vorsatzes und der groben Fahrlässigkeit ausgeschlossen. Dies gilt auch für Schäden, die nicht am Liefergegenstand selbst entstanden sind, insbesondere für Schäden aufgrund des Verlustes von Daten. In Fällen der Verletzung des Lebens, des Körpers oder der Gesundheit haftet der Auftragnehmer auch in Fällen der leicht fahrlässigen Pflichtverletzung.",
      ],
    },
    {
      title: "12. Geltendes Recht",
      body: [
        "Für diese Geschäftsbedingungen sowie die Geschäftsbeziehungen zwischen dem Auftraggeber und dem Auftragnehmer gilt das Recht der Bundesrepublik Deutschland. Andere nationale Rechte sowie das internationale Kaufrecht werden ausgeschlossen.",
      ],
    },
    {
      title: "13. Erfüllungsort/Gerichtsstand",
      body: [
        "Für sämtliche gegenwärtigen und zukünftigen Ansprüche aus der Geschäftsverbindung zwischen Vollkaufleuten einschließlich Wechsel- und Scheckforderungen ist ausschließlicher Gerichtsstand der Sitz des Auftragnehmers. Der gleiche Gerichtsstand gilt, wenn der Käufer keinen allgemeinen Gerichtsstand im Inland hat, nach Vertragsschluss seinen Wohnsitz oder gewöhnlichen Aufenthaltsort aus dem Inland verlegt hat oder sein Wohnsitz oder gewöhnlicher Aufenthaltsort zum Zeitpunkt der Klageerhebung nicht bekannt ist. Hat der private Endverbraucher keinen Wohnsitz innerhalb der Europäischen Union, so ist der Geschäftssitz des Auftragnehmers Gerichtsstand. Im Verkehr mit Endverbrauchern innerhalb der Europäischen Union kann auch das Recht am Wohnsitz des Endverbrauchers anwendbar sein, sofern es sich zwingend um verbraucherrechtliche Bestimmungen handelt.",
      ],
    },
    {
      title: "14. Datenschutz",
      body: [
        "Ohne Ihre ausdrückliche Zustimmung werden Ihre Daten ausschließlich zur Abwicklung Ihrer Bestellung verwendet und im Rahmen der Geschäftsbeziehung per EDV-Anlage gespeichert, es sei denn, Sie möchten gerne zusätzliche Serviceleistungen in Anspruch nehmen. Eine Weitergabe Ihrer Daten an mit der Lieferung beauftragte Unternehmen erfolgt nur insoweit die Auftragsabwicklung dies erforderlich macht. Ansonsten werden die Daten streng vertraulich behandelt und Dritten nicht zugänglich gemacht. Sollten Sie Ihre Unterlagen zu Ihren Bestellungen verlieren, wenden Sie sich bitte per E-Mail, Fax oder Telefon an uns. Wir senden Ihnen eine Kopie der Daten Ihrer Bestellung zu.",
      ],
    },
    {
      title: "15. Lieferzeit / Lieferfristen",
      body: [
        "15.1. Die Lieferfrist wird individuell vereinbart bzw. von uns bei Annahme der Bestellung angegeben. Sofern dies nicht der Fall ist, beträgt die Lieferfrist „ca. … Wochen“, so sind Abweichungen von plus/minus 14 Tagen möglich. Sobald Abweichungen für uns erkennbar sind, werden wir diese dem Käufer umgehend mitteilen und den konkreten Anliefertag einvernehmlich vereinbaren. Konkret vereinbarte Liefertermine werden eingehalten.",
        "15.2. Die Lieferfrist beginnt mit dem Tag der Auftragsbestätigung, jedoch nicht vor Beibringung der vom Käufer zu beschaffenden Unterlagen, Genehmigungen, Freigaben, sowie dem Eingang einer vereinbarten Anzahlung in Höhe von 30% des Auftragswertes, oder dem Nachweis, dass eine vereinbarte Besicherung erfolgt ist.",
        "15.3. Die Lieferfrist ist eingehalten, wenn innerhalb der Lieferfrist die Ware das Lager verlassen hat.",
        "15.4. Sollten unvorhergesehene Hindernisse, die außerhalb unseres Willens liegen und die wir trotz der nach den Umständen des Falles gebotenen Sorgfalt nicht abwenden konnten – gleichviel, ob sie bei uns oder einem Unterlieferanten eintreten – etwa höhere Gewalt (z.B. Krieg oder Naturkatastrophen), Verzögerungen in der Anlieferung wesentlicher Rohstoffe oder andere von uns nicht zu vertretende Umstände – sind wir berechtigt, vom Liefervertrag ganz oder teilweise zurückzutreten oder die Lieferzeit um die Dauer des Hindernisses zu verlängern. Die gleichen Rechte stehen uns im Falle von Streik und Aussperrungen bei uns oder unseren Vorlieferanten zu. Wir werden solche Umstände unseren Kunden unverzüglich mitteilen.",
        "15.5. Im Falle des Lieferverzuges kann der Käufer nach fruchtlos abgelaufener, angemessener Nachfrist vom Vertrag zurücktreten; im Falle der Unmöglichkeit unserer Leistung steht ihm dieses Recht auch ohne Nachfrist zu. Angemessen ist eine Frist von vier Wochen, bei Sonderanfertigung aufgrund spezieller Materialien, Zuschnitte, Konstruktionen, Statiken etc. eine doppelte Frist von acht Wochen. Lieferverzug steht der Unmöglichkeit gleich, wenn die Lieferung länger als vier Wochen, bei Sonderanfertigungen acht Wochen, nicht erfolgt.",
        "15.6. Ansprüche auf Schadensersatz aus Fällen einfacher Fahrlässigkeit werden ausgeschlossen. Sofern wir schuldhaft eine Vertragspflicht oder eine Kardinalpflicht verletzen, ist die Haftung nicht ausgeschlossen, sondern auf den vertragstypischen, vorhersehbaren Schaden begrenzt.",
        "15.7. Sofern ein kaufmännisches Fixgeschäft vereinbart wurde, gelten die Haftungsbegrenzungen aus Abs. 5 und Abs. 6 nicht; gleiches gilt, wenn der Käufer wegen des durch uns zu vertretenden Verzuges geltend machen kann, dass sein Interesse an der Vertragserfüllung weggefallen ist.",
        "15.8. Bei Abrufaufträgen sind uns die Abrufe so rechtzeitig mitzuteilen, dass eine ordnungsgemäße Herstellung und Lieferung möglich sind, mindestens aber 6 Wochen vor dem gewünschten Liefertermin. Abrufaufträge müssen innerhalb von 6 Monaten seit der Bestellung abgerufen werden, sofern keine anderen festen Termine vereinbart worden sind. Erfolgt der Abruf nicht oder nicht vollständig innerhalb von 6 Monaten seit der Bestellung oder zu den vereinbarten Abrufterminen, kommt der Käufer in Annahmeverzug.",
        "Juli 2026 · AC Premium Bau · Ugur Acun",
      ],
    },
  ],
};
