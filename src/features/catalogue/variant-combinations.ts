export type VariantOption = { name: string; values: string[] };
export type VariantCombination = {
  name: string;
  attributes: Record<string, string>;
};

export function generateVariantCombinations(
  options: VariantOption[],
): VariantCombination[] {
  const normalized = options
    .map((option) => ({
      name: option.name.trim(),
      values: [
        ...new Set(option.values.map((value) => value.trim()).filter(Boolean)),
      ],
    }))
    .filter((option) => option.name && option.values.length);
  if (!normalized.length) return [];
  return normalized.reduce<VariantCombination[]>((combinations, option) => {
    if (!combinations.length)
      return option.values.map((value) => ({
        name: value,
        attributes: { [option.name]: value },
      }));
    return combinations.flatMap((combination) =>
      option.values.map((value) => ({
        name: `${combination.name} / ${value}`,
        attributes: { ...combination.attributes, [option.name]: value },
      })),
    );
  }, []);
}
