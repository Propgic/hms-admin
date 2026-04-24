import HeartRateLoader from './HeartRateLoader';

export default function Spinner({ size = 'md', fullPage = false, label }) {
  const heartSize = size === 'sm' ? 'sm' : 'md';
  return <HeartRateLoader fullPage={fullPage} label={label} size={heartSize} />;
}
