import React from 'react';

interface CountryFlagProps {
  countryCode: string;
  className?: string;
}

export const CountryFlag = ({ countryCode, className }: CountryFlagProps) => {
  if (!countryCode || countryCode.length !== 2) {
    return null;
  }

  return (
    <img
      src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`}
      alt={`${countryCode} flag`}
      className={`w-4 h-auto rounded-sm ${className || ''}`}
      loading="lazy"
    />
  );
};