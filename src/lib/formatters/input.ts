const digitsOnly = (value: string, maxLength: number) =>
  value.replace(/\D/g, "").slice(0, maxLength);

const isDeleting = (inputType?: string) => inputType?.startsWith("delete") ?? false;

export function formatBirthDateInput(value: string, inputType?: string) {
  const digits = digitsOnly(value, 8);
  const deleting = isDeleting(inputType);

  if (digits.length < 4) return digits;
  if (digits.length === 4) return deleting ? digits : `${digits}.`;
  if (digits.length < 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`;
  if (digits.length === 6) {
    return deleting
      ? `${digits.slice(0, 4)}.${digits.slice(4)}`
      : `${digits.slice(0, 4)}.${digits.slice(4)}.`;
  }

  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
}

export function formatPhoneInput(value: string, inputType?: string) {
  const digits = digitsOnly(value, 11);
  const deleting = isDeleting(inputType);

  if (digits.length < 3) return digits;
  if (digits.length === 3) return deleting ? digits : `${digits}-`;

  const middleLength = digits.startsWith("010") || digits.length > 10 ? 4 : 3;
  const secondBoundary = 3 + middleLength;

  if (digits.length < secondBoundary) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  if (digits.length === secondBoundary) {
    return deleting
      ? `${digits.slice(0, 3)}-${digits.slice(3)}`
      : `${digits.slice(0, 3)}-${digits.slice(3)}-`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, secondBoundary)}-${digits.slice(
    secondBoundary
  )}`;
}
