# Mappatura e Interpretazione dei Risultati (Output)

Questo documento traccia i file generati nella cartella `output/` collegandoli alla loro origine nel file [analysis_pipeline.R](file:///Users/vivri161803/SAND/analysis_pipeline.R) e fornendo una guida su come leggerli e interpretarli ai fini del Report Accademico.

---

## 1. Analisi Esplorativa

### 📊 `degree_distribution.pdf`
- **Generato in:** [analysis_pipeline.R, riga 154](file:///Users/vivri161803/SAND/analysis_pipeline.R#L154-L160)
- **Interpretazione:** Mostra due istogrammi, l'in-degree (connessioni ricevute) e l'out-degree (connessioni inviate). Dato il network, l'in-degree è estremamente concentrato (quasi tutti i neuroni ricevono 1 legame), mentre l'out-degree è asimmetrico e "pesante" sulla coda (pochi neuroni proiettano molti archi). Evidenzia una topologia a "stella" asimmetrica per alcuni neuroni.

### 📊 `top_betweenness.pdf`
- **Generato in:** [analysis_pipeline.R, riga 163](file:///Users/vivri161803/SAND/analysis_pipeline.R#L163-L168)
- **Interpretazione:** Grafico a barre dei 10 nodi con maggiore Betweenness Centrality. Noterai che **solo 3 neuroni mostrano un valore maggiore di zero** e le barre sembrano poche. Questo accade perché in questa rete il flusso di informazioni è strutturato in larga misura come un sistema di "broadcasting" estremamente asimmetrico: la maggior parte dei neuroni riceve informazioni (sinks) ma non le ritrasmette nel volume esaminato, oppure le invia a cascata (sources) ma non le riceve. Di conseguenza, i percorsi non fanno "salti multipli". I 3 nodi non-zero sono gli unici, rarissimi "neuroni ponte" completi che agiscono come veri intermediari (ricevendo e ritrasmettendo) tra altri neuroni. I nodi con questa caratteristica sono il numero 1, 3, 7.

### 📄 `centrality_table.csv`
- **Generato in:** [analysis_pipeline.R, riga 173](file:///Users/vivri161803/SAND/analysis_pipeline.R#L173-L184)
- **Interpretazione:** Dataset grezzo a livello di nodo per le analisi downstream. Ogni riga è un neurone. Usalo per creare statistiche descrittive (es. *"i neuroni 'Cell body' hanno una betweenness maggiore rispetto a 'Dendritic fragment'?"*).

### 📄 `exploratory_stats.csv`
- **Generato in:** [analysis_pipeline.R, riga 187](file:///Users/vivri161803/SAND/analysis_pipeline.R#L187-L199)
- **Interpretazione:** Statistiche macroscopiche del grafo. Densità bassissima e reciprocità a 0 dimostrano una rete molto sparsa e puramente direzionale. L'assortatività su `type1` e `type2` ti indica la tendenza di omofilia globale: un valore ~0 indica assenza di preferenze aggregate evidenti.
- **Interpretazione Dettagliata dei Valori**: 
  - **Densità (0.0056)**: La rete è incredibilmente sparsa; solo lo 0.5% di tutte le possibili connessioni esiste realmente.
  - **Diadi (Mutue: 0, Asimmetriche: 214, Nulle: 18701)** e **Reciprocità (0)**: Nessun neurone ritrasmette un segnale al neurone da cui l'ha ricevuto. La comunicazione è strettamente unidirezionale (forward-feeding), senza loop di feedback diretti.
  - **Transitività globale (0.0047)**: Anche la probabilità che due nodi connessi a un terzo siano connessi tra loro (clustering) è quasi nulla. Non ci sono "triangoli" o cricche dense.
  - **Assortatività type1 (-0.0057) e type2 (0)**: L'assenza di assortatività suggerisce che i neuroni non scelgono di connettersi preferenzialmente a neuroni identici a loro per tipo anatomico o funzionale (nessuna omofilia evidente aggregata a livello globale).
  - **Centralizzazione (Degree: 0.07, Betweenness: 0.0005)**: Non esiste un singolo "dittatore" o super-hub assoluto nella rete che centralizza tutto il traffico; il controllo è molto distribuito e schiacciato verso il basso.

---

## 2. Modelli ERGM (Exponential Random Graph Models)

### 📄 `ergm_model_selection.csv`
- **Generato in:** [analysis_pipeline.R, riga 260](file:///Users/vivri161803/SAND/analysis_pipeline.R#L260-L276)
- **Interpretazione:** Tabella comparativa dei modelli (M0, M1, M2, M3) ordinata per il criterio BIC (Bayesian Information Criterion). Il modello in cima (BIC minore) è statisticamente il "migliore" compromesso tra adattamento ai dati e parsimonia. È la prova che scegli per giustificare la tua analisi nel report.
- **Interpretazione Dettagliata del Ranking (Modello Migliore vs Peggiore)**:
  - **Perché M6 è il migliore (BIC = 2017)**: M6 è il modello completo che combina sia gli attributi biologici (`nodematch` su type1 e type2) sia la topologia strutturale (`gwidegree` e `gwesp`). Il segreto della sua superiorità risiede proprio nel termine `gwidegree` (Geometrically Weighted In-Degree): siccome la rete ha una struttura di in-degree estremamente asimmetrica (sinks dominanti), l'inserimento di questo termine strutturale permette di modellare quasi perfettamente lo scheletro della rete, abbattendo drasticamente il BIC rispetto ai modelli puramente diadici (M1, M2, M3).
  - **M1 al secondo posto (BIC = 2062)**: `edges + nodefactor(type1)`. È il miglior modello tra quelli "semplici". L'aggiunta di `nodefactor` permette al modello di capire che neuroni di tipo diverso hanno *volumi di traffico* completamente differenti (es. i neuroni piramidali sono iper-attivi, altri frammenti sono quasi silenti). Essendo una rete asimmetrica, modellare la propensione individuale alla connessione funziona estremamente bene.

  > Come interpretare `nodefactor`: 
  In pratica, `nodefactor(type1)` introduce una colonna virtuale per ogni categoria del fattore `type1`. Il coefficiente associato a questa colonna puo' essere interpretato come: "I neuroni piramidali tendono ad avere più (o meno) connessioni rispetto agli altri neuroni in generale?"

  - **M3 (BIC = 2231) e M2 (BIC = 2380)**: Includono i termini di omofilia (`nodematch` su type1 e type2). Migliorano il modello base perché danno informazioni biologiche, ma performano peggio di M1 perché, come abbiamo visto, l'assortatività globale è pressoché nulla: i neuroni in questa rete non formano sinapsi preferenzialmente con neuroni dello stesso tipo, rendendo l'omofilia un predittore debole per il network complessivo.
  - **M0 (BIC = 2652)**: Il modello nullo (Erdős-Rényi). Genera gli archi lanciando una moneta in modo puramente casuale. Serve unicamente come base ("ground truth" peggiore) per valutare gli altri.
  - **Perché M5 è il peggiore (BIC = 2659)**: Risulta peggiore persino del modello nullo puramente casuale (M0 = 2652). Il modello M5 tenta di spiegare la rete basandosi unicamente sul termine `gwesp` (che valuta la propensione a formare triangoli e chiusure transitive). Ma, come scoperto in `exploratory_stats.csv`, la **transitività globale è quasi nulla** (0.0047). Costringere l'algoritmo a cercare una spiegazione basata sui triangoli in una rete priva di triangoli produce un fit orribile, fortemente penalizzato dal BIC.

### 📄 `ergm_coefficients.csv`
- **Generato in:** [analysis_pipeline.R, riga 294](file:///Users/vivri161803/SAND/analysis_pipeline.R#L294-L302)
- **Interpretazione dei Coefficienti (Modello M6):** La tabella riporta i *Log-Odds* (Coefficiente) e le probabilità relative (*Odds Ratio* = `exp(coef)`) dei vari effetti:
  - **`edges` (OR = 0.0005)**: La propensione base a formare archi è infinitesimale (0.05%), il che riflette fedelmente la densità estrema e la natura iper-sparsa della rete.
  - **`nodematch.type1` (OR = 0.024) e `nodematch.type2` (OR = 0.038)**: Sorprendentemente, l'omofilia ha un effetto *fortemente negativo* (Odds Ratio < 1). Significa che i neuroni sono biologicamente *restii* a connettersi ad altri neuroni della stessa categoria. La rete è caratterizzata da **eterofilia**: i neuroni piramidali eccitatori preferiscono connettersi a bersagli inibitori o dendriti, non ad altri piramidali!
  - **`gwideg` (OR = 576.4)**: L'effetto strutturale dell'in-degree è esplosivo. Indica una immensa propensione della rete a creare forti asimmetrie di grado (strutture a stella), dove pochissimi nodi canalizzano flussi enormi rispetto alla media (i famosi "sink"). Questi nodi corrispondono a neuroni che ricevono un numero sproporzionato di sinapsi, agendo come hub di integrazione: i neuroni piramidali.
  - **`gwesp` (OR = 9.66)**: Pur essendo la transitività globale bassissima (0.0047), questo termine ci dice che, *al netto dell'estrema disparità di grado*, se due neuroni condividono già un partner, hanno una probabilità quasi 10 volte superiore di formare un arco diretto tra loro. Segnala la presenza di rari ma intensi micro-circuiti locali (triangoli) nascosti nel volume.

### 📊 `mcmc_diagnostics.pdf`
- **Generato in:** [analysis_pipeline.R, riga 311](file:///Users/vivri161803/SAND/analysis_pipeline.R#L311-L315)
- **Interpretazione:** Tracciati delle catene di Markov. Devono assomigliare a "rumore bianco" stazionario e distribuito normalmente (le famose nuvole "hairy caterpillar"). Se le linee fluttuano troppo a lungo senza stabilizzarsi attorno allo 0, il modello soffre di problemi di mixaggio (degenerazione).

### 📊 `gof_plots.pdf`
- **Generato in:** [analysis_pipeline.R, riga 318](file:///Users/vivri161803/SAND/analysis_pipeline.R#L318-L324)
- **Interpretazione:** Grafici di Goodness of Fit (GoF). Le linee spesse continue (spesso nere) rappresentano le metriche calcolate sul network reale, mentre i boxplot indicano i valori misurati su centinaia di reti simulate automaticamente dal nostro modello vincitore M6. Se la linea solida cade all'interno (o molto vicina) ai boxplot, significa che le equazioni matematiche del modello replicano fedelmente il processo biologico.
  - **Grafico in alto a sinistra (Model Statistics):** Ha in ascissa (asse X) i coefficienti del modello (`edges`, `nodematch`, `gwideg`, ecc.) e in ordinata (asse Y) **il valore numerico (conteggio) di quella specifica statistica** calcolata sul grafo (o lo scarto rispetto al valore reale). Ad esempio, per `edges`, l'asse Y indicherà quanti archi esistono. La linea nera solida traccia il valore esatto contato sul network reale (es. 214 archi), mentre i boxplot indicano il valore contato nelle reti finte simulate. Per dimostrare la convergenza, i boxplot (reti simulate) **devono** essere perfettamente allineati in ordinata sulla linea nera (rete reale). Se fossero sballati verticalmente, il modello sarebbe degenerato.
  - Noterai un adattamento eccellente per la **distribuzione dell'In-Degree e Out-Degree**: il modello ha imparato perfettamente a simulare la topologia "a stella" (broadcasting) e la presenza degli hub piramidali, grazie al termine strutturale `gwideg`.
  - Nei grafici relativi agli **Edgewise Shared Partners (ESP)** e alle **distanze geodetiche**, vedrai un enorme picco iniziale seguito da valori nulli: questo dimostra visivamente che la quasi totalità degli archi non condivide partner (niente triangoli) e che i percorsi attraverso la rete sono brevissimi (1 o 2 salti) o impossibili, replicando fedelmente l'estrema sparsità del tessuto neurale analizzato.

---

## 3. Modelli a Blocchi Stocastici (SBM)

### 📊 `sbm_data_plot.pdf`
- **Generato in:** [analysis_pipeline.R, riga 377](file:///Users/vivri161803/SAND/analysis_pipeline.R#L377-L384)
- **Interpretazione:** Rappresenta la matrice di adiacenza riorganizzata in base ai cluster. L'algoritmo SBM ha identificato matematicamente e in modo del tutto non supervisionato (senza conoscere le etichette biologiche) l'esistenza di **3 blocchi ottimali** (cluster strutturali).
  - Visivamente, i quadranti colorati (o più scuri) lungo o fuori dalla diagonale indicano densità di connessioni tra i neuroni di quel blocco o verso altri blocchi.
  - Nel nostro connettoma, l'individuazione di 3 blocchi rivela una macro-architettura precisissima: c'è un enorme "core" funzionale (il Blocco 3) in cui avviene tutto il traffico sinaptico attivo, e due piccoli blocchi anomali o periferici (Blocco 1 e 2). L'SBM ci suggerisce visivamente che la rete non è un unico groviglio omogeneo, ma è stratificata in ruoli di connettività distinti.

### 📄 `sbm_vs_type1.csv` & `sbm_vs_type2.csv`
- **Generato in:** [analysis_pipeline.R, riga 396](file:///Users/vivri161803/SAND/analysis_pipeline.R#L396-L399)
- **Interpretazione:** Tabelle di contingenza incrociate. Le righe sono i blocchi matematici (es. 1, 2, 3), le colonne sono la classificazione biologica (es. eccitatorio vs inibitorio).
  - *Come si legge (vedi il tuo output):* Se il Blocco 3 contiene **tutti** i neuroni Inibitori (70) e molti Eccitatori (111), mentre i Blocchi 1 e 2 contengono solo neuroni classificati come "Unknown", significa che il modello a blocchi ha ricostruito per conto suo l'architettura biologica, separando perfettamente le entità incognite dai neuroni attivi conosciuti! Fare la heatmap del file `sbm_vs_type1.csv` e `sbm_vs_type2.csv`.

---

## 4. Modelli di Spazio Latente (DLSM)

### 📄 `dlsm_model_selection.csv`
- **Generato in:** [analysis_pipeline.R, riga 436](file:///Users/vivri161803/SAND/analysis_pipeline.R#L436-L443)
- **Interpretazione:** Il confronto dei BIC tra lo spazio euclideo bidimensionale (d=2) e tridimensionale (d=3). Guardando i dati (`2918` per d=2 contro `2027` per d=3), **il modello a 3 dimensioni stravince** nettamente.
  - **Significato Biologico:** Questo risultato è formidabile perché dimostra matematicamente che la probabilità di connessione tra i neuroni non può essere "schiacciata" su una mappa bidimensionale piatta senza generare errori enormi (BIC altissimo). Il network necessita intrinsecamente di un'architettura tridimensionale per far quadrare i suoi archi. Questo si allinea in modo spettacolare all'anatomia reale della corteccia cerebrale del topo, che è un volume di tessuto profondamente 3D. 

### 📊 `dlsm_latent_positions.pdf` & `dlsm_latent_positions_type2.pdf`
- **Generato in:** [analysis_pipeline.R, riga 446](file:///Users/vivri161803/SAND/analysis_pipeline.R#L446-L462)
- **Interpretazione:** Mappe dei nodi collocati nello Spazio Sociale Latente. Nodi posizionati geometricamente vicini nello spazio euclideo del plot indicano neuroni con alta propensione intrinseca a connettersi tra loro, a prescindere dai legami già esistenti. L'uso dei colori (`type1` vs `type2`) ti aiuta a vedere se, ad esempio, i neuroni inibitori formano una nuvola separata ("isola") rispetto agli eccitatori.

### 📊 `dlsm_mcmc_diagnostics.pdf`
- **Generato in:** [analysis_pipeline.R, riga 465](file:///Users/vivri161803/SAND/analysis_pipeline.R#L465-L469)
- **Interpretazione:** Stesso concetto del `mcmc_diagnostics` degli ERGM, ma applicato alla convergenza delle coordinate geometriche del modello Latent Space. Servono a garantire che le proiezioni geometriche siano stabili.