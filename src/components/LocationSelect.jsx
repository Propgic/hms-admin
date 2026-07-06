import { useMemo } from 'react';
import Select from './ui/Select';

// Cascading Country → State → City dropdowns fed by the global locations tree
// (Settings → Locations). Renders as sibling <Select> controls so they drop
// straight into a parent grid.
//
// Controlled: pass current { country, state, city } strings and an onChange
// that receives the full next triple — { country, state, city }. Changing a
// higher level clears the levels below it. Works with both plain component
// state and react-hook-form (wire onChange to setValue-the-three-fields).
//
// `showCountry={false}` / `showCity={false}` hide levels a form doesn't store.
// Any current value missing from the managed tree is still shown as an option
// so editing legacy free-text records never silently drops the saved value.

function toOptions(names, current) {
  const opts = (names || []).map((n) => ({ value: n, label: n }));
  if (current && !names?.some((n) => n === current)) {
    opts.unshift({ value: current, label: `${current} (current)` });
  }
  return opts;
}

export default function LocationSelect({
  locations = [],
  country = '',
  state = '',
  city = '',
  onChange,
  showCountry = true,
  showCity = true,
  defaultCountry = 'India',
  disabled = false,
  isClearable = true,
  labels = {},
  errors = {},
}) {
  const tree = useMemo(() => (Array.isArray(locations) ? locations : []), [locations]);
  const effectiveCountry = showCountry ? country : country || defaultCountry;

  const countryOptions = useMemo(
    () => toOptions(tree.map((c) => c?.name).filter(Boolean), country),
    [tree, country],
  );

  const stateList = useMemo(() => {
    const match = tree.find((c) => c?.name === effectiveCountry) || (!showCountry ? tree[0] : null);
    return match?.states || [];
  }, [tree, effectiveCountry, showCountry]);

  const stateOptions = useMemo(
    () => toOptions(stateList.map((s) => s?.name).filter(Boolean), state),
    [stateList, state],
  );

  const cityOptions = useMemo(() => {
    const match = stateList.find((s) => s?.name === state);
    return toOptions(match?.cities || [], city);
  }, [stateList, state, city]);

  const emit = (next) => onChange?.({ country, state, city, ...next });

  return (
    <>
      {showCountry && (
        <Select
          label={labels.country ?? 'Country'}
          placeholder="Select country"
          options={countryOptions}
          value={country}
          onChange={(val) => emit({ country: val, state: '', city: '' })}
          isDisabled={disabled}
          isClearable={isClearable}
          error={errors.country}
        />
      )}
      <Select
        label={labels.state ?? 'State'}
        placeholder="Select state"
        options={stateOptions}
        value={state}
        onChange={(val) => emit({ state: val, city: '' })}
        isDisabled={disabled}
        isClearable={isClearable}
        error={errors.state}
      />
      {showCity && (
        <Select
          label={labels.city ?? 'City'}
          placeholder="Select city"
          options={cityOptions}
          value={city}
          onChange={(val) => emit({ city: val })}
          isDisabled={disabled}
          isClearable={isClearable}
          error={errors.city}
        />
      )}
    </>
  );
}
