export const CONFIG = {
  theme: {
    background: '#fbfbfd',
    textPrimary: '#1d1d1f',
    textSecondary: '#6e6e73',
    accent: '#0071e3',
    graphNode: '#b0b0b5',
    graphEdge: '#d2d2d7',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  cameraStops: {
    hero: { position: [0, 0, 100], lookAt: [0, 0, 0] },
    interactive_graph: { position: [10, 10, 80], lookAt: [0, 0, 0] },
    data_presentation: { position: [30, 20, 60], lookAt: [0, 0, 0] },
    ergm: { position: [-30, -20, 40], lookAt: [10, 10, 0] },
    latent_space: { position: [0, 40, 20], lookAt: [-10, 0, -10] },
  },
  contentPaths: {
    graphData: '/src/data/graph_data.json',
    csv: {
      exploratoryStats: '/src/data/exploratory_stats.csv',
      centralityTable: '/src/data/centrality_table.csv',
      ergmCoefficients: '/src/data/ergm_coefficients.csv',
      ergmModelSelection: '/src/data/ergm_model_selection.csv',
      dlsmModelSelection: '/src/data/dlsm_model_selection.csv',
      sbmVsType1: '/src/data/sbm_vs_type1.csv',
      sbmVsType2: '/src/data/sbm_vs_type2.csv',
    },
    pdf: {
      degreeDistribution: '/assets/degree_distribution.pdf',
      topBetweenness: '/assets/top_betweenness.pdf',
      gofPlots: '/assets/gof_plots.pdf',
      mcmcDiagnostics: '/assets/mcmc_diagnostics.pdf',
      dlsmLatentPositions: '/assets/dlsm_latent_positions.pdf',
      dlsmLatentPositionsType2: '/assets/dlsm_latent_positions_type2.pdf',
      dlsmMcmcDiagnostics: '/assets/dlsm_mcmc_diagnostics.pdf',
      sbmDataPlot: '/assets/sbm_data_plot.pdf',
    }
  }
};
