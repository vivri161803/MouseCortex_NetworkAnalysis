import pandas as pd

# Caricamento del dataset
df = pd.read_csv("output/centrality_table.csv")

# 1. Confronto della Betweenness Centrality per type1
print("=== Betweenness Centrality per Tipologia (type1) ===")
# Sostituiamo eventuali NaN per pulizia
df['type1'] = df['type1'].fillna('Unknown')
df['type2'] = df['type2'].fillna('Unknown')

stats_type1_betw = df.groupby('type1')['betweenness'].agg(['mean', 'max', 'sum', 'count']).sort_values(by='mean', ascending=False)
print(stats_type1_betw)
print("\n")

# 2. Confronto dell'Out-Degree per type1
print("=== Out-Degree (Connessioni in Uscita) per Tipologia (type1) ===")
stats_type1_out = df.groupby('type1')['degree_out'].agg(['mean', 'max', 'sum', 'count']).sort_values(by='mean', ascending=False)
print(stats_type1_out)
print("\n")

# 3. Analisi per Funzione (type2) - Betweenness e In-Degree
print("=== Analisi Funzionale (type2) ===")
stats_type2 = df.groupby('type2')[['betweenness', 'degree_out', 'degree_in']].mean().round(3)
stats_type2['count'] = df.groupby('type2').size()
print(stats_type2.sort_values(by='betweenness', ascending=False))

# 4. Estrazione di nodi con betweeness non nulla
print("\n=== Nodi con Betweenness non nulla ===")
df_betweenness_non_null = df[df['betweenness'] > 0]
print(df_betweenness_non_null)
