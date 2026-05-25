import { atom } from 'nanostores';

export type SectionId = 'hero' | 'interactive_graph' | 'data_presentation' | 'ergm' | 'latent_space';

export const activeSection = atom<SectionId>('hero');
