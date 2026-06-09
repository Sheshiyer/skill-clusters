// variable-contract.mjs — build the canonical variable-contract groups the taste cortex PRODUCES.
//
// Cambium's pipeline declares taste produces [taste_brief, asset_plan, section_plan, interaction_plan,
// acceptance_checks]. This derives those structured groups from the taste resolution so `taste-resolve
// --json` carries real structured data the downstream build/ops stages consume (and so cambium's
// verifyOutput can judge drift against the contract). Pure — no NIM/network, testable without spend.

export function variableContract({ classification = {}, cluster = 'creative-frontend', directive = '' } = {}) {
  const category = classification.category || 'on-corpus';
  return {
    taste_brief: directive || `Make it feel ${category}.`,
    asset_plan: {
      primary: ['logo', 'hero'],
      aesthetic_category: category,
      cluster,
    },
    section_plan: ['hero', 'problem', 'solution', 'proof', 'pricing', 'cta'],
    interaction_plan: {
      motion: classification.motion || 'subtle',
      type: classification.type || 'clean',
    },
    acceptance_checks: [
      'on-brand palette + type',
      `directive honored: ${(directive || '').slice(0, 60)}`,
      `resolves to cluster: ${cluster}`,
    ],
  };
}
