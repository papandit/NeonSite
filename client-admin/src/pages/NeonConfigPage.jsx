// Neon Configuration — the copy and imagery the neon storefront page renders
// below the customizer. Separate from Neon Studio, which owns the catalogue
// (fonts / colours / sizes) that drives the customizer itself.

import PageHeader from '../components/PageHeader';
import NeonContentEditor from '../components/NeonContentEditor';

export default function NeonConfigPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Neon Configuration"
        subtitle="Product story, photos and badges shown under the neon customizer — for both Neon Light and FloRo Light."
      />
      <NeonContentEditor />
    </div>
  );
}
